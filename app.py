
from flask import Flask, jsonify, request, render_template_string
import os
import json

app = Flask(__name__)

class Node:
    def __init__(self, value):
        self.value = value
        self.right = None
        self.left = None
        self.height = 1
    
def get_height(root):
    return root.height if root else 0

def balance_factor(root):
    return get_height(root.left) - get_height(root.right)

def update_height(root):
    if root:
        root.height = 1 + max(get_height(root.left), get_height(root.right))

def min_node(root):
    while root.left:
        root = root.left
    return root


def rotate_right(root):
    t1 = root.left
    t2 = root.left.right
    t1.right = root
    root.left = t2
    update_height(root)
    update_height(t1)
    return t1

def rotate_left(root):
    t1 = root.right
    t2 = root.right.left
    t1.left = root
    root.right = t2
    update_height(root)
    update_height(t1)
    return t1

def balance(root, log):
    update_height(root)
    bf = balance_factor(root)

    if bf > 1:
        if balance_factor(root.left) < 0:
            root.left = rotate_left(root.left)
            log.append({"rotation": "Left-Right", "at": root.value})
            return rotate_right(root)
        
        else:
            log.append({"rotation": "Right", "at": root.value})
            return rotate_right(root)
    
    if bf < -1:
        if balance_factor(root.right) > 0:
            root.right = rotate_right(root.right)
            log.append({"rotation": "Right-Left", "at": root.value})
            return rotate_left(root)
        else:
            log.append({"rotation": "Left", "at": root.value})
            return rotate_left(root)
        
    return root


def incert(root, value, log):
    if root == None:
        log.append({"action": "incert", "Value": value})
        return Node(value)
    if (value < root.value):
        root.left = incert(root.left, value, log)
    elif (value > root.value):
        root.right = incert(root.right, value, log)
    else:
        log.append({"action": "duplicate", "Value": value})
        return root
    return balance(root, log)

def delete(root, value, log):
    if root == None:
        log.append({"action": "not_found", "Value": value})
        return None
    if value < root.value:
        root.left = delete(root.left, value, log)
    elif value > root.value:
        root.right = delete(root.right, value, log)
    else:
        log.append({"action": "delete", "Value": value})
        if root.left == None:
            return root.right
        if root.right == None:
            return root.left
        seccessor = min_node(root.right)
        root.value = seccessor.value
        root.right = delete(root.right, seccessor.value, log)
    return balance(root, log)

def search(root, value, path):
    if root == None:
        return False
    path.append(root.value)
    if value == root.value:
        return True
    return search(root.left if value < root.value else root.right, value, path)

def tree_to_json(root):
    if root == None:
        return None
    return {
        "Value": root.value,
        "Height": root.height,
        "bf": balance_factor(root),
        "left": tree_to_json(root.left),
        "right": tree_to_json(root.right)
    }

tree_root = None

@app.route("/")
def index():
    with open("index.html") as file:
        return file.read()

@app.route("/api/insert", methods = ["POST"])
def api_insert():
    global tree_root
    val = request.json.get("val")
    if not isinstance(val, int):
        return jsonify({"Error": "value must be an integer"})
    log = []
    tree_root = incert(tree_root, val, log)
    return jsonify({"tree": tree_to_json(tree_root), "log": log})

@app.route("/api/delete", methods = ["POST"])
def api_delete():
    global tree_root
    val = request.json.get("val")
    if not isinstance(val, int):
        return jsonify({})
    log = []
    tree_root = delete(tree_root, val, log)
    return jsonify({"tree": tree_to_json(tree_root), "log": log})

@app.route("/api/search", methods = ["POST"])
def api_search():
    global tree_root
    val = request.json.get("val")
    if not isinstance(val, int):
        return jsonify({})
    path = []
    found = search(tree_root, val, path)
    return jsonify({"found": found, "path": path, "log": [], "tree": tree_to_json(tree_root)})

@app.route("/api/clear", methods = ["POST"])
def api_clear():
    global tree_root
    tree_root = None
    return jsonify({"tree": None, "log":[{"action": "clear"}]})

@app.route("/api/tree", methods = ["POST"])
def api_tree():
    return jsonify({"Tree": tree_to_json(tree_root)})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)