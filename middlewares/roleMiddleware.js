exports.isSchool = (req, res, next) => {
    if (req.user.role !== "SCHOOL") 
     return res.status(403).json({ message: "Réservé aux écoles." });
    next();
};

exports.isAdmin = (req, res, next) => {
    if (req.user.role !== "ADMIN") 
        return res.status(403).json({ message: "Réservé à l'admin." });
    next();
};
