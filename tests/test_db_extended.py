import pytest
from backend.db import _UnavailableCollection, _UnavailableDatabase

def test_unavailable_collection_methods():
    coll = _UnavailableCollection("dummy", "test error")
    methods = [
        "find", "find_one", "insert_one", "insert_many", 
        "update_one", "update_many", "delete_one", "delete_many", 
        "count_documents", "aggregate"
    ]
    for method in methods:
        with pytest.raises(RuntimeError, match="MongoDB is unavailable; cannot access collection 'dummy'"):
            getattr(coll, method)()

def test_unavailable_database_getattr():
    db = _UnavailableDatabase("test error")
    coll1 = db.some_collection
    assert isinstance(coll1, _UnavailableCollection)
    coll2 = db.some_collection
    assert coll1 is coll2  # caching

    with pytest.raises(AttributeError):
        _ = db._private_attr
