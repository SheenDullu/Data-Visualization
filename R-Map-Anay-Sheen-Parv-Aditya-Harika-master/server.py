import psycopg2
import sys
sys.path.append("/home/local/ASUAD/arohill1/.local/lib/python3.5/site-packages")
from flask import Flask, render_template, request
from flask_cors import CORS, cross_origin
from collections import Counter
import re
import pandas as pd
import operator
import random
from flask import jsonify
from textblob import TextBlob

import  sys
app = Flask(__name__)

print(sys.path)

cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route('/table')
@cross_origin()
def send_data():
	con = psycopg2.connect("host=" + host + "dbname='rmap' user='dv' password='r-map-project'")
	cur = con.cursor()
	cur.execute("""select tweet_id,user_screen_name,full_text,created_at from rmap where is_retweet='False'""")
	data = [col for col in cur]
	cur.close()
	return jsonify(data)

def clean_tweet(tweet):
        '''
        Utility function to clean tweet text by removing links, special characters
        using simple regex statements.
        '''
        return ' '.join(re.sub("(@[A-Za-z0-9]+)|([^0-9A-Za-z \t]) |(\w+:\/\/\S+)", " ", tweet).split())

def get_tweet_sentiment(tweet):
	'''
    Utility function to classify sentiment of passed tweet
    using textblob's sentiment method
    '''
	# create TextBlob object of passed tweet text
	analysis = TextBlob(clean_tweet(tweet))
	# set sentiment
	if analysis.sentiment.polarity > 0:
		return 'positive'
	elif analysis.sentiment.polarity == 0:
		return 'neutral'
	else:
		return 'negative'

@app.route('/pie')
@cross_origin()
def pie_data():
	id = request.args.get('id', None)
	con = psycopg2.connect("host=" + host + "dbname='rmap' user='dv' password='r-map-project'")
	cur = con.cursor()

	final_data = []

	cur.execute(
		"select tweet_id, full_text from rmap where retweeted_status_id = '%s' " % id)

	data1 = [col for col in cur]
	level_one = []

	for i in data1:
		level_one.append(i[0])

	complete_data = []
	for level in level_one:
		cur.execute("select tweet_id, full_text from rmap where retweeted_status_id= '%s'" % level)
		data2 = [col for col in cur]
		keywords = []
		for i in data2:
			keywords.append(i[1])

		if len(keywords) > 0:
			complete_data.append(keywords)
	#sorted(complete_data, key=lambda k: len(com[k]), reverse=True)
	sorted(complete_data, key=lambda l: (len(l), l))
	complete_data = complete_data[:10]
	i = 0
	keyplayer = ['chris', 'dwight', 'jim', 'mike', 'pam', 'ross', 'justin', 'kelly', 'bob', 'nike', 'tyler', 'sam']
	for data in complete_data:
		pos = 1
		neg = 1
		neu = 1

		for arr in data:
			t_data = ""
			d = arr.rsplit('\n')

			for ele in range(0, len(d)-1):
				t_data += t_data + " " + d[ele]


			sentiment = get_tweet_sentiment(t_data)
			if sentiment == 'positive':
				pos +=1
			elif sentiment == 'negative':
				neg +=1
			else:
				neu +=1
		i = (i+1)%10
		final_data.append([keyplayer[i], [pos, neu, neg]])


	cur.close()
	print(final_data)

	return jsonify(final_data)

@app.route('/wordcloud')
@cross_origin()
def send_data_2():
	id_str = request.args.get('id', None)
	con = psycopg2.connect("host=" + host + "dbname='rmap' user='dv' password='r-map-project'")
	cur = con.cursor()
	cur.execute("select tweet_id, full_text from rmap where retweeted_status_id=%s or tweet_id=%s", (id_str, id_str))
	data1 = [col for col in cur]
	level_one = []
	for i in data1:
		if i[0] != id_str:
			level_one.append(i[0])
	cur.execute("select tweet_id, full_text from rmap where retweeted_status_id=ANY(%s);", (level_one,))
	data2 = [col for col in cur]
	data = data1 + data2
	cur.close()
	text = []
	STOPWORDS = ["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself",
				 "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself",
				 "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that",
				 "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
				 "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as",
				 "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through",
				 "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off",
				 "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how",
				 "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
				 "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should",
				 "now"]
	for i in data:
		text.append(i[1])
	raw_string = ' '.join(text)
	raw_string = re.sub(r'\n',' ', raw_string)

	no_links = re.sub(r'http\S+', '', raw_string)
	no_unicode = re.sub(r"\\[a-z][a-z]?[0-9]+", '', no_links)
	no_special_characters = re.sub('[^A-Za-z ]+', '', no_unicode)
	words = no_special_characters.split(" ")
	words = [w for w in words if len(w) > 2]  # ignore a, an, be, ...
	words = [w.lower() for w in words]
	words = [w for w in words if w not in STOPWORDS]
	uni = Counter(words).keys()  # equals to list(set(words))
	count = Counter(words).values()  # counts the elements' frequency
	res = dict(zip(uni, count))
	final = dict(sorted(res.items(), key=operator.itemgetter(1), reverse=True)[:20])
	print(final)
	return jsonify(final)


@app.route('/wordcloud_senti')
@cross_origin()
def wordcloud_senti():
	id_str = request.args.get('id', None)
	con = psycopg2.connect("host=" + host + "dbname='rmap' user='dv' password='r-map-project'")
	cur = con.cursor()
	cur.execute("select tweet_id, full_text from rmap where retweeted_status_id=%s or tweet_id=%s", (id_str, id_str))
	data1 = [col for col in cur]
	level_one = []
	for i in data1:
		if i[0] != id_str:
			level_one.append(i[0])
	cur.execute("select tweet_id, full_text from rmap where retweeted_status_id=ANY(%s);", (level_one,))
	data2 = [col for col in cur]
	data = data1 + data2
	cur.close()
	text = []
	STOPWORDS = ["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself",
				 "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself",
				 "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that",
				 "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
				 "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as",
				 "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through",
				 "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off",
				 "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how",
				 "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
				 "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should",
				 "now"]
	for i in data:
		text.append(i[1])
	raw_string = ' '.join(text)
	raw_string = re.sub(r'\n',' ', raw_string)

	no_links = re.sub(r'http\S+', '', raw_string)
	no_unicode = re.sub(r"\\[a-z][a-z]?[0-9]+", '', no_links)
	no_special_characters = re.sub('[^A-Za-z ]+', '', no_unicode)
	words = no_special_characters.split(" ")
	words = [w for w in words if len(w) > 2]  # ignore a, an, be, ...
	words = [w.lower() for w in words]
	words = [w for w in words if w not in STOPWORDS]
	uni = Counter(words).keys()  # equals to list(set(words))
	count = Counter(words).values()  # counts the elements' frequency
	res = dict(zip(uni, count))
	final = dict(sorted(res.items(), key=operator.itemgetter(1), reverse=True)[:20])
	res = {}

	for key, value in final.items():
		sentiment = get_tweet_sentiment(key)
		if sentiment == 'positive':
			res[key] = [value, 0]
		elif sentiment == 'negative':
			res[key] = [value, 1]
		else:
			res[key] = [value, 2]

	print(res)
	return jsonify(res)



@app.route('/rmap')
@cross_origin()
def send_data_3():
	id_str = request.args.get('id', None)
	con = psycopg2.connect("host=" + host + "dbname='rmap' user='dv' password='r-map-project'")
	cur = con.cursor()
	cur.execute("select tweet_id, user_screen_name, retweeted_status_id from rmap where retweeted_status_id=%s or tweet_id=%s",(id_str,id_str))
	data1 = [col for col in cur]
	level_one = []
	for i in data1:
		if i[0] != id_str:
			level_one.append(i[0])
	cur.execute("select tweet_id, user_screen_name, retweeted_status_id from rmap where retweeted_status_id=ANY(%s);", (level_one,))
	data2 = [col for col in cur]
	data = data1 + data2
	cur.close()
	# count = Counter(L).values() # counts the elements' frequency
	# final = dict(sorted(res.items(), key=operator.itemgetter(1), reverse=True)[:10])
	D = {}
	D['nodes'] = []
	for i in data:
		if i[0] == id_str:
			obj = {}
			obj['id'] = i[0]
			obj['group'] = 1
			D['nodes'].append(obj)
		elif i[2] == id_str:
			obj = {}
			obj['id'] = i[0]
			obj['group'] = 2
			D['nodes'].append(obj)
		elif i[2] in level_one:
			obj = {}
			obj['id'] = i[0]
			obj['group'] = 3
			D['nodes'].append(obj)
	D['links'] = []
	for i in data:
		if i[2] == id_str:
			obj = {}
			obj['source'] = id_str
			obj['target'] = i[0]
			obj['value'] = 6
			D['links'].append(obj)
		elif i[2] in level_one:
			obj = {}
			obj['source'] = i[2]
			obj['target'] = i[0]
			obj['value'] = 7
			D['links'].append(obj)
	print(D)
	return jsonify(D)

@app.route('/timeline')
@cross_origin()
def send_data_4():
	id_str = request.args.get('id', None)
	con = psycopg2.connect("host=" + host + "dbname='rmap' user='dv' password='r-map-project'")
	cur = con.cursor()
	cur.execute("select tweet_id, created_at from rmap where retweeted_status_id=%s or tweet_id=%s",(id_str,id_str))
	data1 = [col for col in cur]
	level_one = []
	for i in data1:
		if i[0] != id_str:
			level_one.append(i[0])
	cur.execute("select tweet_id, created_at from rmap where retweeted_status_id=ANY(%s);", (level_one,))
	data2 = [col for col in cur]
	data = data1 + data2
	cur.close()
	D = pd.DataFrame(data, columns = ['tweet_id' , 'created_at'])

	return D.to_csv()

@app.route('/')
@cross_origin()
def homepage():
	return render_template('index.html')


if __name__ == "__main__":
	host = "'localhost' "
	app.run(host='0.0.0.0')
