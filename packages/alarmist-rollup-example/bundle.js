function getOther() {
  return 'Other Name'
}

function getName() {
  return 'name' + getOther()
}

const name = getName();

console.log(name);

export { name };
