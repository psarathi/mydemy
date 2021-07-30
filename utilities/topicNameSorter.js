module.exports = topicNameSorter = (a, b) => {
    const topicNumberA = parseInt(a.name.substring(0, a.name.indexOf('.')));
    const topicNumberB = parseInt(b.name.substring(0, b.name.indexOf('.')));
    return topicNumberA - topicNumberB;
};
