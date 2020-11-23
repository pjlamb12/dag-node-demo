function doConversion(arr) {
	const result = [];
	const levels = {};

	const modify = (data, pid = 0, level = 0) =>
		data
			.filter(({ parentIds, stepId }) => {
				if (levels[level] && levels[level].includes(stepId)) return false;
				return parentIds.includes(pid);
			})
			.forEach((e) => {
				if (!levels[level]) levels[level] = [];
				levels[level].push(e.stepId);

				// Only insert if the item is not already in the model
				if (findInDoubleArray(e.stepId, result) === -1) {
					if (!result[level]) result[level] = [e];
					else result[level].push(e);
				}

				// sort by branchPath on a given level
				if (result[level - 1]) {
					const sortedResults = [];
					result[level - 1].forEach((i) => {
						const childrenArray = result[level].filter((ch) => ch.parentIds.includes(i.stepId));
						childrenArray.sort((a, b) => {
							return a.branchPath > b.branchPath ? 1 : -1;
						});
						sortedResults.push(...childrenArray);
					});
					result[level] = [...sortedResults];
				}

				modify(data, e.stepId, level + 1);
			});

	modify(arr);
	return result;
}

const items = [
	{ branchPath: 1, name: 'Step 1', parentIds: [0], stepId: 1 },
	{ branchPath: 2, name: 'Step 3', parentIds: [1], stepId: 3 },
	{ branchPath: 1, name: 'Step 4', parentIds: [1], stepId: 4 },
];

const result = doConversion(items);

function findInDoubleArray(idToFind, doubleArr) {
	const flat = doubleArr.flat();
	return flat.findIndex((item) => item.stepId === idToFind);
}

function removeItem(idToRemove, flatArray, isChildOfDeletedBranch) {
	const children = flatArray.filter((item) => item.parentIds.includes(idToRemove));
	const childBranchPath1 = children.find((i) => i.branchPath === 1);
	const childrenNotBranchPath1 = children.filter((i) => i.branchPath > 1);
	const itemToRemove = flatArray.find((i) => i.stepId === idToRemove);

	// if the item that will be removed has multiple children, we have to figure out which to keep and which to delete
	if (children.length > 1) {
		// keep descendants of children.branchPath = 1 if it exists
		if (childBranchPath1) {
			// Set child.branchPath === 1 to itemToRemove.branchPath
			childBranchPath1.branchPath = itemToRemove.branchPath;
			// set child.branchPath === 1.parentIds = itemToRemove.parentIds
			if (childBranchPath1.parentIds.length === 1) {
				childBranchPath1.parentIds = [...itemToRemove.parentIds];
			} else {
				const idxToRemove = childBranchPath1.parentIds.findIndex((i) => i === idToRemove);
				childBranchPath1.parentIds.splice(idxToRemove, 1);
			}
		}

		// remove descendants of children.branchPath > 1;
		for (const childToBeRemoved of childrenNotBranchPath1) {
			flatArray = removeItem(childToBeRemoved.stepId, flatArray, true);
		}
	} else if (children.length === 1) {
		// if the lone child has only one parent, then just go ahead and remove that item
		if (children[0].parentIds.length === 1) {
			if (isChildOfDeletedBranch) {
				flatArray = removeItem(children[0].stepId, flatArray, isChildOfDeletedBranch);
			} else {
				children[0].parentIds = [...itemToRemove.parentIds];
				children[0].branchPath = itemToRemove.branchPath;
			}
		} else {
			// if the lone child has more than one parent id, then remove the item which is being removed from the parentIds array
			const idxToRemove = children[0].parentIds.findIndex((i) => i === idToRemove);
			children[0].parentIds.splice(idxToRemove, 1);
		}
	}

	const itemToRemoveIdx = flatArray.findIndex((i) => i.stepId === idToRemove);
	flatArray.splice(itemToRemoveIdx, 1);

	return flatArray;
}

function createChildrenItems(startingBranch, numberOfChildren, nextNumber, parentIds) {
	const newChildren = [];
	for (let count = 1; count <= numberOfChildren; count++) {
		const newItem = {
			branchPath: startingBranch++,
			name: `Step ${nextNumber}`,
			parentIds: [...parentIds],
			stepId: nextNumber++,
		};
		newChildren.push(newItem);
	}

	newChildren.sort((a, b) => a.branchPath > b.branchPath);

	return newChildren;
}

function addItem(parentIds, flatArray, nextNumber = 1, numberOfChildren = 1, startingCount = 1) {
	const potentialChildrenIds = [];
	parentIds.forEach((pid) => {
		return flatArray.filter((f) => f.parentIds.includes(pid)).forEach((id) => potentialChildrenIds.push(id.stepId));
	});

	const newChildren = createChildrenItems(startingCount, numberOfChildren, nextNumber, parentIds);

	potentialChildrenIds.forEach((childId) => {
		const child = flatArray.find((i) => i.stepId === childId);

		parentIds.forEach((pid) => {
			const oldParentIdIndex = child.parentIds.findIndex((cpid) => cpid === pid);
			child.parentIds.splice(oldParentIdIndex, 1);
			child.parentIds.push(newChildren[0].stepId);
		});
	});

	flatArray.push(...newChildren);
	return flatArray;
}

function addItemAsNewPath(parentId, flatArray, nextNumber, numberOfChildren) {
	const currentChildrenOfParent = flatArray
		.filter((item) => item.parentIds.includes(parentId))
		.sort((a, b) => (a.branchPath > b.branchPath ? 1 : -1));
	const nextBranch = currentChildrenOfParent[currentChildrenOfParent.length - 1].branchPath + 1;
	const newChildren = createChildrenItems(nextBranch, numberOfChildren, nextNumber, [parentId]);

	return [...flatArray, ...newChildren];
}

function getNodeDepth(stepId, items) {
	const item = items.find((i) => i.stepId === stepId);
	let depth = 0;

	if (!item.parentIds.includes(0)) {
		const allDepths = [];
		for (const itemParentId of item.parentIds) {
			depth = 1 + getNodeDepth(itemParentId, items);
			allDepths.push(depth);
		}
		depth = allDepths.sort((x, y) => (x - y ? 1 : -1))[0];
	}

	return depth;
}

function canAddRelation(childId, parentId, items) {
	const childItem = items.find((item) => item.stepId === childId);
	const parentItem = items.find((item) => item.stepId === parentId);
	if (!childItem || !parentItem) {
		return false;
	}

	// does child already have parentId
	const isAlreadyChild = isNodeAChildOfParent(childId, parentId, items);

	// the parentId can not be a sibling to childId
	const nodesAreSiblings = areNodesSiblings(childId, parentId, items);

	// the child needs to be deeper than the parent
	const childDepth = getNodeDepth(childId, items);
	const parentDepth = getNodeDepth(parentId, items);
	const childIsDeeper = childDepth > parentDepth;

	// No circular parentIds
	const circularDependency = wouldCreateCircularDependency(childId, parentId, items);

	return !isAlreadyChild && !nodesAreSiblings && childIsDeeper && !circularDependency;
}

function wouldCreateCircularDependency(id1, id2, items) {
	const item1 = items.find((item) => item.stepId === id1);
	const item2 = items.find((item) => item.stepId === id2);

	return item1.parentIds.includes(id2) || item2.parentIds.includes(id1);
}

function isNodeAChildOfParent(childId, parentId, items) {
	const childItem = items.find((item) => item.stepId === childId);
	const parentItem = items.find((item) => item.stepId === parentId);

	if (!childItem || !parentItem) {
		return false;
	}

	let isParent = childItem.parentIds.includes(parentId);

	if (!isParent) {
		for (const childParentId of childItem.parentIds) {
			isParent = isNodeAChildOfParent(childParentId, parentId, items);

			if (isParent) break;
		}
	}

	return isParent;
}

function areNodesSiblings(node1Id, node2Id, items) {
	const node1 = items.find((item) => item.stepId === node1Id);
	const node2 = items.find((item) => item.stepId === node2Id);

	if (!node1 || !node2) {
		return false;
	}

	let found = false;
	for (const parentId of node1.parentIds) {
		found = node2.parentIds.includes(parentId);

		if (found) break;
	}

	return found;
}

module.exports = {
	doConversion,
	findInDoubleArray,
	removeItem,
	addItem,
	areNodesSiblings,
	getNodeDepth,
	isNodeAChildOfParent,
	wouldCreateCircularDependency,
	canAddRelation,
	addItemAsNewPath,
};
