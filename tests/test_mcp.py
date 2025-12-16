import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.tools import ask_about_strategy
print(ask_about_strategy())