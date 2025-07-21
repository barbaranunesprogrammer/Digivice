class Digimon {
  constructor({ name = "", photo = "", level = "", type = "", types = [], actualType = "", attribute = "" } = {}) {
    this.name = name;
    this.photo = photo;
    this.level = level;
    this.type = type;
    this.types = types;
    this.actualType = actualType;
    this.attribute = attribute;
  }
}
