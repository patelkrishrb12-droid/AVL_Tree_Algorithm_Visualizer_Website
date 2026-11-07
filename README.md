# AVL_Tree_Algorithm_Visualizer_Website
An AVL tree (named after inventors Adelson-Velsky and Landis) is a self-balancing binary search tree (BST).
It was the first such data structure invented in 1962. In a regular BST, if you insert data in a sorted or nearly-
sorted order, the tree can degenerate into a linked list, making operations slow (O(n) instead of O(log n)).
An AVL tree solves this by automatically re-balancing itself after every insertion or deletion, guaranteeing
efficient performance at all times. AVL tree logic is much easier to see than to read in pseudocode. A visualizer
typically lets users insert and delete nodes step-by-step, Watch balance factors update live at each node,
view tree’s height how many nodes does it have etc. The website’s frontend processes user input while
it’s backend builds the tree and arranges nodes if the rotation is required. The website uses flask for its
framework, which can be used to make web application faster and easier to run especially for website with
either server or database.

# What I Accomplished
Build a website for visualizing AVL tree algorithum. Built insertion, deletion, and search operations that pre-
serve the BST property. Implemented all four rotation cases (LL, RR, LR, RL) with automatic rebalancing.
Users can insert and delete values and watch the tree update in real time. Handled cascading rebalancing
during deletion. Recalculated tree layout dynamically so nodes reposition cleanly after every change.

# What I Learned
Coding in javascript to connect backend and frontend. Coding for server and hosting it. Testing the
prototype version of website with and without server. Handling user input, outlier or bad input. Using Json
to converse between server and frontend. Deploying the server using services provided by wasmer. Using
class in HTML to group various different elements such as buttons, canvas area, input, log etc. How to make
outstanding looking website using HTML and CSS.

# Resources
AVL tree Algorithm Website: https://python-patelkrishrb12.wasmer.app/ <br>
Wasmer: https://wasmer.io/
Python: https://www.python.org/
HTML: https://html.com/
Javascript: https://www.javascript.com/
Flask: https://flask.palletsprojects.com/en/stable/
