import masterDataService from "../services/masterDataService.js";

export const getMasterOptionSet = async (req, res) => {
  const key = req.params.key;
  const options = await masterDataService.getOptionSet(key);

  return res.status(200).json({
    status: "success",
    component: {
      data: { key },
      dataScope: { options: { [key]: options } },
      elements: { labels: {}, urls: {} },
      structure: { header: {}, widgets: [], config: {}, actions: [] },
    },
    message: "Master options fetched successfully",
  });
};
