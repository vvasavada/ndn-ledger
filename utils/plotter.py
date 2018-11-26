import networkx as nx
import matplotlib.pyplot as plt
import csv

with open('edges') as edges:
    data = list(csv.reader(edges))

G = nx.DiGraph()
G.add_edges_from(data)
nx.draw(G, with_labels=True)
plt.show()
