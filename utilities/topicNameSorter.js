const topicNameSorter = (a, b) => {
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
};

module.exports = topicNameSorter;
