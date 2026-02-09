import sys

def replace_lines(file_path, start_line, end_line, content_file):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        with open(content_file, 'r', encoding='utf-8') as f:
            new_content = f.read()

        # Adjust for 0-based index
        start_idx = start_line - 1
        end_idx = end_line # Slice is up to end_idx not included, but we want to replace up to line 913?
        # If start=897, end=913. We want to remove 897..913. 
        # Python slice [start_idx:end_idx]. 
        # 897th line is index 896. 913th line is index 912.
        # So we want to remove from 896 to 913 (exclusive of 913? No, inclusive of 912).
        
        # User defined start_line and end_line are 1-based inclusive.
        # So lines[start_line-1 : end_line] should be replaced.
        
        pre = lines[:start_line-1]
        post = lines[end_line:]
        
        # Ensure new_content ends with expected newline if needed, or matches block style
        if not new_content.endswith('\n'):
             new_content += '\n'

        new_lines = pre + [new_content] + post
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    replace_lines(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])
