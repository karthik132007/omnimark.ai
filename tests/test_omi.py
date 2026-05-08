from Engine.OMI.omi import explain_stats
try:
    print(explain_stats({"test":"data"}))
except Exception as e:
    print("ERROR:", repr(e))
