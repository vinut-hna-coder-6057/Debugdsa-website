export const checkCertification = async (user) => {
  if (!user.certified && user.points >= 100) {
    user.certified = true;
    user.certificationDate = new Date();

    // Optional levels
    if (user.points >= 500) {
      user.certificationLevel = "Gold";
    } else if (user.points >= 250) {
      user.certificationLevel = "Silver";
    } else {
      user.certificationLevel = "Bronze";
    }

    await user.save();
  }
};