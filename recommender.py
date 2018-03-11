import tensorflow as tf
import json
import sys
import numpy
import pandas
from sklearn.cluster import KMeans
from sklearn.neighbors import KDTree

def read_in():
    lines = sys.stdin.readlines()
    line = lines[0].strip()
    return line

def main():
	json_data = read_in()
	ingreidents_as_list = process_recipes(json_data)
	print(recommend_recipes_by_ingredients(6, ingreidents_as_list))

def process_recipes(recipe_data):
   	recipe_data_frame = pandas.read_json(recipe_data)
   	ingreidents_as_list = ingredients_encoded(recipe_data_frame)
   	return ingreidents_as_list


def ingredients_encoded(recipe_data_frame):
    mergedIngredients = []
    ingredients_list = recipe_data_frame.ingredients.values.tolist()
    for ingredients in ingredients_list :
        mergedIngredients += ingredients
    mergedIngredients = list(set(mergedIngredients))
    empty_rows = numpy.empty((len(recipe_data_frame),len(mergedIngredients)))
    dataFrames = pandas.DataFrame(empty_rows, columns = mergedIngredients)
    for index, ingredients in enumerate(ingredients_list):
        for ingredient in ingredients:
            dataFrames.at[index, ingredient] = 1
    return dataFrames


def recommend_recipes_by_ingredients(number_of_recommendations, ingredients_data_frame):
    kdt = KDTree(ingredients_data_frame, leaf_size=30, metric='euclidean')
    recommendations = kdt.query(ingredients_data_frame, number_of_recommendations+1, return_distance=False)
    return [list(filter(lambda id: id != index , ingredients)) for index, ingredients in enumerate(recommendations)]

if __name__ == '__main__':
	main()
