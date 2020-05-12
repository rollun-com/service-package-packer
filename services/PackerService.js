/* eslint-disable no-unused-vars */
const Service = require('./Service');
const packer = require("3d-bin-packing");

/**
 * Pack collection of items into collection of containers
 *
 * body Body
 * returns Result
 * */
const pack = ({body}) => new Promise(
  async (resolve, reject) => {
    try {
      const packer = packerFactory(body.container, body.items);
      const formattedResponse = formatPackingResult(packer.optimize());
      resolve(Service.successResponse(formattedResponse));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

const packerFactory = (containers, wrappers) => {
  let wrapperArray = new packer.WrapperArray();
  let instanceArray = new packer.InstanceArray();
  // packer.PackerForm
  for (const container of containers) {
    wrapperArray.push(
      new packer.Wrapper(container.name, container.price, container.width, container.height, container.length, container.thickness),
    );
  }
  for (const wrapper of wrappers) {
    instanceArray.insert(instanceArray.end(), wrapper.quantity, new packer.Product(wrapper.name, wrapper.width, wrapper.height, wrapper.length))
  }
  return new packer.Packer(wrapperArray, instanceArray);
}

const formatPackingResult = (result) => {
  const data = result.data_;
  const containers = data.map(wrapper => ({
    name: wrapper.getName(),
    length: `${wrapper.getWidth()}, ${wrapper.getHeight()}, ${wrapper.getLength()}`,
    spaceUtilization: wrapper.getUtilization()
  }));
  const items = data.reduce((acc, wrapper) => {
    return acc.concat(wrapper.matrix_.reduce((rows, row) => {
      return rows.concat(row.map(item => ({
        name: item.instance.getName(),
        position: `${item.x}, ${item.y}, ${item.z}`,
        layoutScale: `${item.instance.getWidth()}, ${item.instance.getHeight()}, ${item.instance.getLength()}`
      })));
    }, []));
  }, []);
  return {
    cost: result.getPrice(),
    containers: containers,
    items: items
  };
}

module.exports = {
  pack,
};
