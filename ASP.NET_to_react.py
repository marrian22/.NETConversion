import os
import google.generativeai as genai
import re
from pathlib import Path

# Set your  API key (or set key as an environment variable)
genai.configure(api_key="key")

# Model to use
model = genai.GenerativeModel('gemini-2.5-flash')

# Step 1: Find all WinForms groups (.cs + .Designer.cs + .resx)
def find_winforms_forms(project_path):
    forms = {}
    for root, _, files in os.walk(project_path):
        for file in files:
            if file.endswith(".cs") and not file.endswith(".designer.cs"):
                base_name = file[:-8]  # Remove '.cs'
                cs_path = os.path.join(root, file)
                designer_path = os.path.join(root, f"{base_name}.aspx.designer.cs")
                # resx_path = os.path.join(root, f"{base_name}.resx")

                if os.path.exists(designer_path):
                    forms[base_name] = {
                        "code": cs_path,
                        "designer": designer_path,
                        # "resx": resx_path if os.path.exists(resx_path) else None
                    }
    return forms

# Safely read file contents
def read_file(path):
    if path and os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""

#  Step 2: Create the prompt to convert one form to React
def create_prompt(form_name, code_cs, code_designer):
    return f"""
You are an expert software developer helping convert legacy ASP .NET applications into modern ReactJS apps using functional components and hooks.

I have a WinForms form with three related files:
- The logic file ({form_name}.aspx.cs)
- The UI layout and control declarations ({form_name}.aspx.Designer.cs)

---

📄 Code-behind (.cs):
[BEGIN_CS]
{code_cs}
[END_CS]

📄 Designer (.Designer.cs):
[BEGIN_DESIGNER]
{code_designer}
[END_DESIGNER]


---
Please output the result as:
1. A `.jsx` component — wrapped between `[BEGIN_JSX]` and `[END_JSX]`
2. A corresponding `.css` file — wrapped between `[BEGIN_CSS]` and `[END_CSS]`
3. A route configuration snippet — wrapped between `[BEGIN_ROUTES]` and `[END_ROUTES]`

Do not add explanation or markdown. Only raw code blocks between those tags.

Requirements:
- Use functional React components and hooks.
- Translate layout from Designer.cs to semantic HTML + React.
- Translate basic controls (Button, Label, TextBox, etc) to react/HTML/css equivalents
- Hook up events like `Click`, `TextChanged`, etc.
- Convert C# logic to React-compatible JavaScript (hooks, handlers, useState, etc).
- Provide a code block with placeholder for External calls(API calls, DB calls,etc), navigation with proper comments.
- Externalize all styling into CSS.
- Suggest or implement a strategy to deal with the .resx resources (e.g., hardcoded strings, localization, images).
- For routing:
  - Export the component as default.
  - Provide a route snippet that registers this component with React Router.
  - Use the route path as `/{form_name.lower()}` (e.g. `/loginform`).
- Make reasonable assumptions where needed.

"""

# Step 3: Send the prompt to LLM and get a response
def call_llm(prompt, form_name):
    try:
        response = model.generate_content(prompt)
        # --- Process the response ---
        #print("Generated Content:")
        #print(response.text)
        return response.text

    except Exception as e:
        print(f"An error occurred: {e} while converting {form_name}")
    

# Step 4: Process all forms, convert, and save output
def process_forms(project_path, output_path):
    os.makedirs(output_path, exist_ok=True)
    forms = find_winforms_forms(project_path)

    if not forms:
        print("No valid WinForms forms found in the project.")
        return
    all_imports = set()
    all_route_elements = []

    for form_name, paths in forms.items():
        print(f"\n🔄 Converting form: {form_name}")

        # Read original WinForms files
        code_cs = read_file(paths["code"])
        code_designer = read_file(paths["designer"])
       # code_resx = read_file(paths["resx"])

        # Create and send prompt
        prompt = create_prompt(form_name, code_cs, code_designer)
        react_code = call_llm(prompt, form_name)

        # Save the output
        if react_code:
            jsx_code, css_code, route_code = extract_parts(react_code)
            if jsx_code:
                jsx_file = Path(output_path) / f"{form_name}.jsx"
                with open(jsx_file, "w", encoding="utf-8") as f:
                    f.write(jsx_code)
                print(f"JSX saved: {jsx_file}")
            else:
                print(f"JSX not found in model output for {form_name}")

            if css_code:
                css_file = Path(output_path) / f"{form_name}.css"
                with open(css_file, "w", encoding="utf-8") as f:
                    f.write(css_code)
                print(f"CSS saved: {css_file}")
            else:
                print(f"CSS not found in model output for {form_name}")

            if route_code:
                # Split route_code lines into imports and <Route> elements
                for line in route_code.splitlines():
                    line = line.strip()
                    if line.startswith("import"):
                        all_imports.add(line)
                    elif line.startswith("<Route"):
                        all_route_elements.append(line)
                print(f"Route config added for {form_name}")
            else:
                print(f"Route config not found for {form_name}")
        # After processing all forms, write the aggregated routes.js file
    # Write aggregated routes.js file
    if all_route_elements:
        routes_file = Path(output_path) / "routes.js"
        with open(routes_file, "w", encoding="utf-8") as f:
            f.write("// Auto-generated routes\n")
            f.write("import React from 'react';\n")
            f.write("import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';\n")
            for imp in sorted(all_imports):
                f.write(f"{imp}\n")
            f.write("\n")
            f.write("export default function AppRoutes() {\n")
            f.write("  return (\n")
            f.write("    <Router>\n")
            f.write("      <Routes>\n")
            for route in all_route_elements:
                f.write(f"        {route}\n")
            f.write("      </Routes>\n")
            f.write("    </Router>\n")
            f.write("  );\n")
            f.write("}\n")

        print(f"Aggregated routes.js saved: {routes_file}")
    else:
        print("No route configs were generated.")

def extract_parts(llm_response):
    """Extract .jsx and .css content from the LLM response using tag markers."""
    jsx_match = re.search(r"\[BEGIN_JSX\](.*?)\[END_JSX\]", llm_response, re.DOTALL)
    css_match = re.search(r"\[BEGIN_CSS\](.*?)\[END_CSS\]", llm_response, re.DOTALL)
    routes_match = re.search(r"\[BEGIN_ROUTES\](.*?)\[END_ROUTES\]", llm_response, re.DOTALL)

    jsx_code = jsx_match.group(1).strip() if jsx_match else None
    css_code = css_match.group(1).strip() if css_match else None
    route_code = routes_match.group(1).strip() if routes_match else None


    return jsx_code, css_code, route_code

# Entry point
if __name__ == "__main__":
    print("🛠️ WinForms ➡️ ReactJS Converter ")

    #project_dir = input("Enter path to your WinForms project: ").strip()
    #output_dir = input("Enter path to save React components: ").strip()
    project_dir = r"C:\Workspaces\Books-ASP.NET-WebForms-WCF-master"
    output_dir = r"C:\Workspaces\Code\ASP.NET\Books-ASP.NET-WebForms-WCF-master_New"

    process_forms(project_dir, output_dir)
