import json
import sys
import numpy
import pandas
from sklearn.cluster import KMeans
from sklearn.neighbors import KDTree
import pickle

def read_in():
	lines = sys.stdin.readlines()
	line = lines[0].strip()
	return line

def main():
	mode = sys.argv[1]
	if mode == "PROCESS":
		json_data = read_in()
		ingredients_as_list = process_recipes(json_data)
		pickle.dump(ingredients_as_list, open("tree.p", "wb"))
	elif mode == "RECOMMEND":
		recipe_id = int(sys.argv[2])
		ingredients_as_list = pickle.load(open("tree.p", "rb"))
		print(recommend_recipes_by_ingredients(recipe_id, 6, ingredients_as_list))

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
	empty_rows = numpy.zeros((len(recipe_data_frame),len(mergedIngredients)))
	dataFrames = pandas.DataFrame(empty_rows, columns = mergedIngredients)

	for index, row in recipe_data_frame.iterrows():
		ingredients = row.ingredients
		dataFrames.at[index, "id"] = row.id
		for ingredient in ingredients:
			dataFrames.at[index, ingredient] = 1
	dataFrames["id"] = dataFrames["id"].astype(numpy.int64)
	dataFrames.set_index("id", inplace = True)
	return dataFrames


def recommend_recipes_by_ingredients(recipe_id, number_of_recommendations, ingredients_data_frame):
	kdt = KDTree(ingredients_data_frame)
	#we query for number_of_recommendations + 1 since it returns itself as the closest recipe - thus removing that from the recommendation
	recommendations = kdt.query([ingredients_data_frame.loc[recipe_id]], number_of_recommendations+1, return_distance=False)
	# the 0th index access in recommendations[0] is required since the query takes a 2d array, however, in this case, we only needed a single recommendation. 
	recommendation_ids = [ingredients_data_frame.index.values[recipe_index] for recipe_index in recommendations[0]]
	if recipe_id in recommendation_ids:
		recommendation_ids.remove(recipe_id)
	return recommendation_ids

if __name__ == '__main__':
	main()
