exports.isLearner = (req, res, next) => {
    if (req.user.role !== "LEARNER") 
        return res.status(403).json({ message: "Réservé aux étudiants." });
    next();
};

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
exports.verifySchoolAccess = (req, res, next) => {
    // Seul l'admin peut vérifier/rejeter les écoles
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ 
            message: "Action non autorisée. Seul l'administrateur peut effectuer cette action." 
        });
    }
    next();
};