import os
from pymongo import MongoClient
from dotenv import load_dotenv
from backend.config import get_mongo_uri

load_dotenv()

MONGO_URI = get_mongo_uri()


class _UnavailableCollection:
	def __init__(self, collection_name: str, error_message: str):
		self._collection_name = collection_name
		self._error_message = error_message

	def _raise(self):
		raise RuntimeError(
			f"MongoDB is unavailable; cannot access collection '{self._collection_name}'. "
			f"Root cause: {self._error_message}"
		)

	def find(self, *args, **kwargs):
		self._raise()

	def find_one(self, *args, **kwargs):
		self._raise()

	def insert_one(self, *args, **kwargs):
		self._raise()

	def insert_many(self, *args, **kwargs):
		self._raise()

	def update_one(self, *args, **kwargs):
		self._raise()

	def update_many(self, *args, **kwargs):
		self._raise()

	def delete_one(self, *args, **kwargs):
		self._raise()

	def delete_many(self, *args, **kwargs):
		self._raise()

	def count_documents(self, *args, **kwargs):
		self._raise()

	def aggregate(self, *args, **kwargs):
		self._raise()


class _UnavailableDatabase:
	def __init__(self, error_message: str):
		self._error_message = error_message
		self._collections = {}

	def __getattr__(self, item: str):
		if item.startswith("_"):
			raise AttributeError(item)
		if item not in self._collections:
			self._collections[item] = _UnavailableCollection(item, self._error_message)
		return self._collections[item]


try:
	client = MongoClient(
		MONGO_URI,
		connectTimeoutMS=5000,
		serverSelectionTimeoutMS=5000,
	)
	db = client["omnimark"]
except Exception as exc:
	client = None
	db = _UnavailableDatabase(str(exc))
