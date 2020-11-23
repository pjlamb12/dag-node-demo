const {
	doConversion,
	findInDoubleArray,
	removeItem,
	addItem,
	addItemAsNewPath,
	areNodesSiblings,
	getNodeDepth,
	isNodeAChildOfParent,
	wouldCreateCircularDependency,
	canAddRelation,
} = require('./script');

/* ***************************************************************************
		1			
	2		3		
		4			
**************************************************************************** */
test('should convert the simple array to a DAG model', () => {
	const items = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
	];
	const result = doConversion(items);
	const expectedResult = [
		[{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 }],
		[
			{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
			{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		],
		[{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 }],
	];

	expect(result).toStrictEqual(expectedResult);
});

/* ***************************************************************************
		1			
	2		3		
	4				
		5
**************************************************************************** */
test('should convert a more complicated array to a DAG model', () => {
	const items = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 },
		{ branchPath: 1, name: 'Step 5', parentIds: [4, 3], stepId: 5 },
	];
	const result = doConversion(items);
	const expectedResult = [
		[{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 }],
		[
			{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
			{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		],
		[{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 }],
		[{ branchPath: 1, name: 'Step 5', parentIds: [4, 3], stepId: 5 }],
	];

	expect(result).toStrictEqual(expectedResult);
});

/* ***************************************************************************
		1			
	5	6	7		
2	3				
  4
**************************************************************************** */
test('should properly display the graph with a node that has three children', () => {
	const items = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [5], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [5], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
		{ branchPath: 1, name: 'Step 5', parentIds: [1], stepId: 5 },
		{ branchPath: 2, name: 'Step 6', parentIds: [1], stepId: 6 },
		{ branchPath: 3, name: 'Step 7', parentIds: [1], stepId: 7 },
	];
	const dagModel = [
		[{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 }],
		[
			{ branchPath: 1, name: 'Step 5', parentIds: [1], stepId: 5 },
			{ branchPath: 2, name: 'Step 6', parentIds: [1], stepId: 6 },
			{ branchPath: 3, name: 'Step 7', parentIds: [1], stepId: 7 },
		],
		[
			{ branchPath: 1, name: 'Step 2', parentIds: [5], stepId: 2 },
			{ branchPath: 2, name: 'Step 3', parentIds: [5], stepId: 3 },
		],
		[{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 }],
	];
	const result = doConversion(items);

	expect(result).toStrictEqual(dagModel);
});

/* ***************************************************************************
		1			
	4		3		
				
**************************************************************************** */
test('should properly order the items on a row by branch path', () => {
	const items = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [1], stepId: 4 },
	];
	const dagModel = [
		[{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 }],
		[
			{ branchPath: 1, name: 'Step 4', parentIds: [1], stepId: 4 },
			{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		],
	];
	const result = doConversion(items);

	expect(result).toStrictEqual(dagModel);
});

test('should return if an item is found in a two dimensional array', () => {
	const dagModel = [
		[{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 }],
		[
			{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
			{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		],
		[{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 }],
		[{ branchPath: 1, name: 'Step 5', parentIds: [4, 3], stepId: 5 }],
	];
	const found1 = findInDoubleArray(1, dagModel);
	const found6 = findInDoubleArray(6, dagModel);

	expect(found1).toBe(0);
	expect(found6).toBe(-1);
});

/* ***************************************************************************
	1			|		1
2		3		|		5	
	4			|	2		3
				|	    4
**************************************************************************** */
test('should add an item to the array', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [5], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [5], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
		{ branchPath: 1, name: 'Step 5', parentIds: [1], stepId: 5 },
	];
	const itemsList = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
	];
	const result = addItem([1], itemsList, 5, 1);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	1			|			1
2		3		|		5		6
	4			|	2	3
				|	  4
**************************************************************************** */
test('should add two items to the array', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [5], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [5], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
		{ branchPath: 1, name: 'Step 5', parentIds: [1], stepId: 5 },
		{ branchPath: 2, name: 'Step 6', parentIds: [1], stepId: 6 },
	];
	const itemsList = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
	];
	const result = addItem([1], itemsList, 5, 2);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	1			|			1
2		3		|		5	6	7
	4			|	2	3
				|	  4
**************************************************************************** */
test('should add three items to the array', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [5], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [5], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
		{ branchPath: 1, name: 'Step 5', parentIds: [1], stepId: 5 },
		{ branchPath: 2, name: 'Step 6', parentIds: [1], stepId: 6 },
		{ branchPath: 3, name: 'Step 7', parentIds: [1], stepId: 7 },
	];
	const itemsList = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
	];
	const result = addItem([1], itemsList, 5, 3);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	1			|			1
2		3		|		4		5
				|	2	3
				|		
**************************************************************************** */
test('should add two items to the array as a child to the first node and a parent to the original branch', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [4], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [4], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [1], stepId: 4 },
		{ branchPath: 2, name: 'Step 5', parentIds: [1], stepId: 5 },
	];
	const itemsList = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
	];
	const result = addItem([1], itemsList, 4, 2);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	1			|			1
2		3		|		2	3	5
	4			|		  4
				|	 
**************************************************************************** */
test('should add a new child path from 1 at the same level as 2 and 3', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
		{ branchPath: 3, name: 'Step 5', parentIds: [1], stepId: 5 },
	];
	const itemsList = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
	];
	const result = addItemAsNewPath(1, itemsList, 5, 1);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	1			|			1
2		3		|		2  3  5	 6
	4			|		 4
				|	 
**************************************************************************** */
test('should add a new child path from 1 at the same level as 2 and 3', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
		{ branchPath: 3, name: 'Step 5', parentIds: [1], stepId: 5 },
		{ branchPath: 4, name: 'Step 6', parentIds: [1], stepId: 6 },
	];
	const itemsList = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
	];
	const result = addItemAsNewPath(1, itemsList, 5, 2);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	1			|		1
2		3		|	2		3
4				|	
**************************************************************************** */
test('should remove a child at the end of the graph', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
	];
	const itemsArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },

		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2, 3], stepId: 4 },
	];
	const result = removeItem(4, itemsArray);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	1			|		1
	2			|		3
	3			|
**************************************************************************** */
test('should remove a child with only a single child', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 3', parentIds: [1], stepId: 3 },
	];
	const itemsArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 1, name: 'Step 3', parentIds: [2], stepId: 3 },
	];
	const result = removeItem(2, itemsArray);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	1			|		1
2		3		|	2		5
4		5		|	4
**************************************************************************** */
test('should remove the branch 2 child and rearrange', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 },
		{ branchPath: 2, name: 'Step 5', parentIds: [1], stepId: 5 },
	];
	const itemsArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 },
		{ branchPath: 1, name: 'Step 5', parentIds: [3], stepId: 5 },
	];
	const result = removeItem(3, itemsArray);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	 1			|		2
2		3		|		4
4		5		|
**************************************************************************** */
test('should remove a parent of nodes that branch and rearrange', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 2', parentIds: [0], stepId: 2 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 },
	];
	const itemsArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 },
		{ branchPath: 1, name: 'Step 5', parentIds: [3], stepId: 5 },
	];
	const result = removeItem(1, itemsArray);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	1			|		2
2	3	4		|		5
5	6	7		|
**************************************************************************** */
test('should remove all but the branch 1 child and rearrange', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 2', parentIds: [0], stepId: 2 },
		{ branchPath: 1, name: 'Step 5', parentIds: [2], stepId: 5 },
	];
	const itemsArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 3, name: 'Step 4', parentIds: [1], stepId: 4 },
		{ branchPath: 1, name: 'Step 5', parentIds: [2], stepId: 5 },
		{ branchPath: 1, name: 'Step 6', parentIds: [3], stepId: 6 },
		{ branchPath: 1, name: 'Step 7', parentIds: [4], stepId: 7 },
	];
	const result = removeItem(1, itemsArray);

	expect(result).toStrictEqual(expectedResultArray);
});

/* ***************************************************************************
	1			|		1
2	3	4		|	2	6	4
5	6	7		|	5		7
**************************************************************************** */
test('should remove all but the branch 1 child and rearrange', () => {
	const expectedResultArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 3, name: 'Step 4', parentIds: [1], stepId: 4 },
		{ branchPath: 1, name: 'Step 5', parentIds: [2], stepId: 5 },
		{ branchPath: 2, name: 'Step 6', parentIds: [1], stepId: 6 },
		{ branchPath: 1, name: 'Step 7', parentIds: [4], stepId: 7 },
	];
	const itemsArray = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 3, name: 'Step 4', parentIds: [1], stepId: 4 },
		{ branchPath: 1, name: 'Step 5', parentIds: [2], stepId: 5 },
		{ branchPath: 1, name: 'Step 6', parentIds: [3], stepId: 6 },
		{ branchPath: 1, name: 'Step 7', parentIds: [4], stepId: 7 },
	];
	const result = removeItem(3, itemsArray);

	expect(result).toStrictEqual(expectedResultArray);
});

test('should return result if two nodes are siblings', () => {
	const items = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 3, name: 'Step 3', parentIds: [1], stepId: 3 },
	];

	const result1 = areNodesSiblings(2, 3, items);
	const result2 = areNodesSiblings(1, 3, items);

	expect(result1).toBe(true);
	expect(result2).toBe(false);
});

test('should return the proper depth for a node', () => {
	const items = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 },
		{ branchPath: 2, name: 'Step 5', parentIds: [2], stepId: 5 },
		{ branchPath: 1, name: 'Step 6', parentIds: [5, 3], stepId: 6 },
	];

	const depth1 = getNodeDepth(1, items);
	const depth3 = getNodeDepth(3, items);
	const depth5 = getNodeDepth(5, items);
	const depth6 = getNodeDepth(6, items);

	expect(depth1).toBe(0);
	expect(depth3).toBe(1);
	expect(depth5).toBe(2);
	expect(depth6).toBe(3);
});

test('should return if a node is a child of another node', () => {
	const items = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 },
		{ branchPath: 2, name: 'Step 5', parentIds: [2], stepId: 5 },
		{ branchPath: 1, name: 'Step 6', parentIds: [5, 3], stepId: 6 },
	];

	const isChild1 = isNodeAChildOfParent(6, 1, items);
	const isChild2 = isNodeAChildOfParent(4, 3, items);
	const isChild3 = isNodeAChildOfParent(4, 6, items);
	const isChild4 = isNodeAChildOfParent(6, 4, items);
	const isChild5 = isNodeAChildOfParent(1, 4, items);

	expect(isChild1).toBe(true);
	expect(isChild2).toBe(false);
	expect(isChild3).toBe(false);
	expect(isChild4).toBe(false);
	expect(isChild5).toBe(false);
});

test('should return if two nodes would create a circular dependency', () => {
	const items = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 },
		{ branchPath: 2, name: 'Step 5', parentIds: [2], stepId: 5 },
		{ branchPath: 1, name: 'Step 6', parentIds: [5, 3], stepId: 6 },
	];

	const result1 = wouldCreateCircularDependency(6, 1, items);
	const result2 = wouldCreateCircularDependency(5, 6, items);
	const result3 = wouldCreateCircularDependency(4, 6, items);

	expect(result1).toBe(false);
	expect(result2).toBe(true);
	expect(result3).toBe(false);
});

test('should return if a relationship can be added between two nodes', () => {
	const items = [
		{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
		{ branchPath: 1, name: 'Step 2', parentIds: [1], stepId: 2 },
		{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
		{ branchPath: 1, name: 'Step 4', parentIds: [2], stepId: 4 },
		{ branchPath: 2, name: 'Step 5', parentIds: [2], stepId: 5 },
		{ branchPath: 1, name: 'Step 6', parentIds: [5, 3], stepId: 6 },
	];

	const result1 = canAddRelation(6, 4, items);
	const result2 = canAddRelation(5, 4, items);
	const result3 = canAddRelation(6, 1, items);
	const result4 = canAddRelation(6, 3, items);
	const result5 = canAddRelation(5, 3, items);

	expect(result1).toBe(true);
	expect(result2).toBe(false);
	expect(result3).toBe(false);
	expect(result4).toBe(false);
	expect(result5).toBe(true);
});
