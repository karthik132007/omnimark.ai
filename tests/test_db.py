from backend.db import db

result = db.results.find_one()
print(result)
