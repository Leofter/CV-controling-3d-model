export class ModelMetadata {
  constructor({ id, name, category, source, created_at: createdAt, model_url: modelUrl, thumbnail_url: thumbnailUrl }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.source = source;
    this.createdAt = createdAt;
    this.modelUrl = modelUrl;
    this.thumbnailUrl = thumbnailUrl;
  }

  static fromApi(payload) {
    return new ModelMetadata(payload);
  }
}
