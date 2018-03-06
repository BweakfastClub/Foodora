import tensorflow as tf
import json
import sys
import pandas

def read_in():
    lines = sys.stdin.readlines()
    line = lines[0].strip()
    return line

def main():
	json_data = read_in()
	process_recipes(json_data)

def process_recipes(recipe_data):
   	data_frame = pandas.read_json(recipe_data)
   	print(data_frame)

if __name__ == '__main__':
	main()
