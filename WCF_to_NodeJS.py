import os
import google.generativeai as genai
import re
from pathlib import Path
import time

# Set your  API key (or set key as an environment variable)
genai.configure(api_key="key")

# Model to use
model = genai.GenerativeModel('gemini-2.5-flash')

# Step 2: Find all WCF files (.cs + .svc)
def find_wcf_files(root_dir):
    svc_files = []
    all_cs_files = {} # Stores content of all .cs files for easier lookup

    print(f"Scanning directory: {root_dir}")

    # First pass: Collect all .cs files and their content for efficient lookup
    for subdir, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".cs"):
                filepath = os.path.join(subdir, file)
                content = read_file(filepath)
                if content:
                    all_cs_files[filepath] = content
    
   # Second pass: Process .svc files and link them to .cs implementation and interface files
    for subdir, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".svc"):
                svc_filepath = os.path.join(subdir, file)
                svc_content = read_file(svc_filepath)

                if not svc_content:
                    continue

                # Regex to find the Service attribute in the .svc file
                # Example: <%@ ServiceHost Language="C#" Debug="true" Service="MyNamespace.MyService" %>
                match = re.search(r'Service="([^"]+)"', svc_content)
                if match:
                    full_service_name = match.group(1)
                    # Extract simple class name (e.g., "MyService" from "MyNamespace.MyService")
                    simple_service_name = full_service_name.split('.')[-1]

                    implementation_file = None
                    interface_file = None

                    # Try to find the implementation .cs file
                    # Heuristic: Look for a .cs file with the simple service name in its stem
                    # and containing 'class' followed by the simple service name.
                    for cs_path, cs_content in all_cs_files.items():
                        if simple_service_name in Path(cs_path).stem and \
                           re.search(r'class\s+' + re.escape(simple_service_name) + r'(\s|:)', cs_content):
                            implementation_file = cs_path
                            break

                    if implementation_file:
                        # Now, try to find the interface file from the implementation content
                        # Heuristic: Look for a class implementing an interface
                        # Example: public class MyService : IMyService
                        # This regex looks for the interface name after the colon in a class definition
                        impl_content = all_cs_files[implementation_file]
                        interface_match = re.search(
                            r'class\s+' + re.escape(simple_service_name) + r'\s*:\s*(I[A-Za-z0-9_]+)',
                            impl_content
                        )

                        if interface_match:
                            interface_name = interface_match.group(1)
                            # Try to find the .cs file for this interface
                            for cs_path, cs_content in all_cs_files.items():
                                if interface_name in Path(cs_path).stem and \
                                   re.search(r'interface\s+' + re.escape(interface_name) + r'(\s|{)', cs_content) and \
                                   '[ServiceContract]' in cs_content: # Ensure it's a ServiceContract
                                    interface_file = cs_path
                                    break
                        else:
                            # Fallback: If no explicit interface found via inheritance,
                            # try to find a .cs file with [ServiceContract] and the IServiceName pattern.
                            # This handles cases where the interface might be in a separate file
                            # and not explicitly inherited in the same line as the class definition.
                            for cs_path, cs_content in all_cs_files.items():
                                if '[ServiceContract]' in cs_content and \
                                   f"I{simple_service_name}" in Path(cs_path).stem:
                                    interface_file = cs_path
                                    break


                    if implementation_file and interface_file:
                        svc_files.append({
                            'svc_file': svc_filepath,
                            'implementation_file': implementation_file,
                            'interface_file': interface_file,
                            'service_name': simple_service_name
                        })
                        print(f"Found service: {simple_service_name}")
                        print(f"  .svc: {svc_filepath}")
                        print(f"  Impl: {implementation_file}")
                        print(f"  Intf: {interface_file}")
                    else:
                        print(f"Could not link .svc file to both implementation and interface: {svc_filepath}")
                        if not implementation_file:
                            print("  - Implementation file not found or linked incorrectly.")
                        if not interface_file:
                            print("  - Interface file not found or linked incorrectly.")
                else:
                    print(f"Could not find 'Service' attribute in {svc_filepath}. Skipping.")
    return svc_files

# Safely read file contents
def read_file(path):
    if path and os.path.exists(path):
        try:       
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            print(f"Error reading file {path}: {e}")
    return ""

#  Step 3: Create the prompt to convert WCF to NodeJS
def create_prompt(service_name, svc_content, implementation_code, interface_code):
    """
    Creates a detailed prompt for the LLM to convert WCF to NestJS.
    Includes the .svc content, service implementation, and interface definition.
    """
    prompt = f"""
You are a senior developer specializing in WCF to Node.js (NestJS) migration.
Your task is to convert the following WCF service definition, its C# implementation,
and its C# interface into equivalent Node.js code using the NestJS framework.

**WCF Service Name:** {service_name}

**1. WCF Service (.svc) Configuration:**
```xml
{svc_content}
```

**2. C# Service Interface Definition (with ServiceContract/OperationContract):**
```csharp
{interface_code}
```

**3. C# Service Implementation:**
```csharp
{implementation_code}
```

**Instructions for Node.js (NestJS) Conversion:**
* Create a NestJS module, service, and controller for this WCF service.
* Map WCF `ServiceContract` to NestJS `@Controller()` or `@Module()`.
* Map WCF `OperationContract` methods to NestJS controller methods (e.g., `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`). Use appropriate HTTP verbs based on the WCF operation's likely intent (e.g., `Get` for data retrieval, `Post` for creation, `Put` for updates). If intent is unclear, default to `@Post()`.
* Preserve method signatures, parameters, and return types as closely as possible, using TypeScript for type definitions.
* Translate WCF Data Contracts and Message Contracts into TypeScript interfaces or classes.
* Include necessary NestJS imports and decorators.
* Provide a complete, runnable NestJS code structure (e.g., `service.ts`, `controller.ts`, `module.ts`).
* IMPORTANT: For each generated file, include a comment at the top of the code block specifying its relative path and filename. For example:
TypeScript

// filename: src/modules/your-service/your-service.module.ts
// ... your code here ...
This is the only format that will be accepted. Do not include any other markdown headings or conversational text within the output. The response should only be the code blocks themselves.
"""
    return prompt

# Step 4: Send the prompt to LLM and get a response
def call_llm(prompt, file_name):
    """
    Calls the LLM with the generated prompt and returns the response text.
    Includes basic error handling and exponential backoff for API calls.
    """
    max_retries = 2
    base_delay = 1 # seconds

    for attempt in range(max_retries):
        try:
            print(f"Calling LLM for {file_name} (Attempt {attempt + 1}/{max_retries})...")
            response = model.generate_content(prompt)
            #print("Generated response:")
            # Check if response has text content
            if response and hasattr(response, 'text') and response.text:
                #print(response.text)
                return response.text
            else:
                print(f"LLM returned an empty or invalid response for {file_name}.")
                # If response is empty, retry
                raise ValueError("Empty LLM response")

        except Exception as e:
            print(f"An error occurred while converting {file_name} (Attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                print(f"Max retries reached for {file_name}. Skipping this file.")
                return None
    return None # Should not be reached if successful or max retries exhausted


def extract_code_blocks(llm_output):
    """
    Extracts code blocks from LLM output based on `// filename:` comments.
    Supports blocks without Markdown fences.
    Returns a dictionary: { filename: code_content }
    """
    lines = llm_output.splitlines()
    files = {}
    current_filename = None
    current_content = []

    for line in lines:
        # Detect new file start
        match = re.match(r'//\s*filename:\s*(.+)', line.strip(), re.IGNORECASE)
        if match:
            # Save previous file if any
            if current_filename and current_content:
                files[current_filename] = "\n".join(current_content).strip()
                current_content = []

            # Start new file
            current_filename = match.group(1).strip()
        elif current_filename:
            current_content.append(line)

    # Save last file
    if current_filename and current_content:
        files[current_filename] = "\n".join(current_content).strip()

    return files

# Step 5: Process the LLM output and save it to nodeJs file.
def save_nodejs_output_to_files(service_name, output_path, node_code):
    """
    Extracts Node.js code from the LLM's output and saves it to corresponding
    files within a service-specific directory.

    Args:
        service_name (str): The name of the service, used for directory creation.
        output_path (str): The base directory where service output directories will be created.
        node_code (str): The string containing the LLM's generated Node.js code,
                         expected to have code blocks with filename comments.
    """
    if node_code:
        # Create a subdirectory for each service's output for better organization
        service_output_dir = Path(output_path) / service_name
        os.makedirs(service_output_dir, exist_ok=True)
        print(f"Ensured output directory exists: {service_output_dir}")

        # Extract individual files from the LLM's output string
        extracted_files = extract_code_blocks(node_code)

        if not extracted_files:
            print(f"Warning: No separate code files were extracted for '{service_name}'.")
            print("Please ensure the LLM output contains code blocks formatted like this:")
            print("```typescript")
            print("// filename: your-file.ts")
            print("your code here")
            print("```")
            # Fallback: if no specific files are found, save the whole thing as a generic .ts file
            default_file_name = f"{service_name}.ts" # Or .js
            with open(service_output_dir / default_file_name, "w", encoding="utf-8") as f:
                f.write(node_code)
            print(f"As a fallback, the entire output was saved to: {service_output_dir / default_file_name}")
            return

        # Save each extracted code block to its own file
        for filename, content in extracted_files.items():
            # Construct the full path, including any subdirectories specified in the filename
            # e.g., 'src/modules/users/users.module.ts' will create 'output_path/service_name/src/modules/users/'
            file_path = service_output_dir / filename
            os.makedirs(file_path.parent, exist_ok=True) # Ensure parent directories exist
            try:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Successfully saved: {file_path}")
            except IOError as e:
                print(f"Error saving file {file_path}: {e}")
    else:
        print(f"No Node.js code provided for '{service_name}'. LLM response was empty or an error occurred.")
      

# Step 1: Process all files, convert, and save output
def process_services(project_path, output_path):
    """
    Main function to orchestrate finding WCF files, converting them via LLM,
    and saving the generated Node.js code.
    """
    os.makedirs(output_path, exist_ok=True)
    
    # Get the linked WCF service components (svc, implementation, interface)
    linked_wcf_services = find_wcf_files(project_path)

    if not linked_wcf_services:
        print("No linked WCF service files found in the project. Please check your project path and file structure.")
        return

    for service_info in linked_wcf_services:
        service_name = service_info['service_name']
        svc_file_path = service_info['svc_file']
        implementation_file_path = service_info['implementation_file']
        interface_file_path = service_info['interface_file']

        print(f"\n🔄 Converting service: {service_name}")
        print(f"  .svc: {svc_file_path}")
        print(f"  Impl: {implementation_file_path}")
        print(f"  Intf: {interface_file_path}")

        # Read original service files' content
        svc_content = read_file(svc_file_path)
        implementation_code = read_file(implementation_file_path)
        interface_code = read_file(interface_file_path)

        if not (svc_content and implementation_code and interface_code):
            print(f"Skipping {service_name}: Could not read all required source files. Ensure files exist and are readable.")
            continue

        # Create and send prompt to the LLM
        prompt = create_prompt(service_name, svc_content, implementation_code, interface_code)
        node_code = call_llm(prompt, service_name)

        # Save the LLM's output
        save_nodejs_output_to_files(service_name, output_path, node_code)

    
# Entry point
if __name__ == "__main__":
    print("🛠️ WCF ➡️ NodeJS Converter ")

    project_dir = r"C:\Workspaces\Books-ASP.NET-WebForms-WCF-master"
    output_dir = r"C:\Workspaces\Code\ASP.NET_WCF\Books-ASP.NET-WebForms-WCF-master"

    process_services(project_dir, output_dir)
