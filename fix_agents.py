import glob

for f in glob.glob('nova/orchestrator/agents/*.py'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Add pass inside empty except blocks
    content = content.replace("        except Exception:\n    \n        profile_context = \"\"\"", "        except Exception:\n            pass\n    \n        profile_context = \"\"\"")
    # Actually wait, my replace might not match exactly. Let's do something simpler:
    content = content.replace("        except Exception:\n    \n        profile_context", "        except Exception:\n            pass\n    \n        profile_context")
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Fixed agents!")
