import {
  createPublisherService,
  deletePublisherService,
  getAllPublishersService,
  getPublisherByIdService,
  updatePublisherService,
} from "../services/PublisherService.js";

export async function createPublisher(req, res) {
  try {
    const { name } = req.body;
    const publisher = await createPublisherService(name);
    if (!publisher) {
      return res.status(404).json({ message: "Publisher not found" });
    }
    return res.status(201).json(publisher);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
export async function updatePublisher(req, res) {
  try {
    const { name } = req.body;
    const publisher = await updatePublisherService(req.params.id, name);
    if (!publisher) {
      return res.status(404).json({ message: "Publisher not found" });
    }
    return res.status(200).json(publisher);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
export async function deletePublisher(req, res) {
  try {
    const publisher = await deletePublisherService(req.params.id);
    if (!publisher) {
      return res.status(404).json({ message: "Publisher not found" });
    }
    return res.status(200).json(publisher);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
export async function getPublisherById(req, res) {
  try {
    const publisher = await getPublisherByIdService(req.params.id);
    if (!publisher) {
      return res.status(404).json({ message: "Publisher not found" });
    }
    return res.status(200).json(publisher);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getAllPublishers(req, res) {
  try {
    const publishers = await getAllPublishersService();
    if (!publishers) {
      return res.status(404).json({ message: "Publishers not found" });
    }
    return res.status(200).json(publishers);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
