export const handleError = (res, error, message) => {
    console.error(message, error);
    res.status(500).send({ error: message });
};
//# sourceMappingURL=errorHandler.js.map