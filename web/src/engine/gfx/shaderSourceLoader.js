export default class ShaderSourceLoader {
  setResponseType() {
    return this;
  }

  load(source, onLoad) {
    Promise.resolve().then(() => onLoad(source));
  }
}
