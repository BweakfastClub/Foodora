# import tensorflow as tf
import json
import sys

def read_in():
    lines = sys.stdin.readlines()
    return json.loads(lines[0])

def main():
	lines = read_in();
	print(lines);


if __name__ == '__main__':
	main()