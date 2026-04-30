from sklearn.cluster import DBSCAN
from encoder import model

def cluster_answers(answers, eps=0.5, min_samples=2):
    embeddings = model.encode(answers)
    clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(embeddings)
    clusters = {}
    for idx, label in enumerate(clustering.labels_):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(answers[idx])
    return clusters