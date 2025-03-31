const badgeCriteria = {
  VERIFIED_USER: {
    name: 'Verified User',
    requirements: {
      emailVerified: true,
      phoneVerified: true,
      photoVerified: true
    }
  },
  TRUSTED_HAULER: {
    name: 'Trusted Hauler',
    requirements: {
      completedJobs: 20,
      averageRating: 4.5,
      responseRate: 0.9
    }
  },
  SPEEDY_DELIVERY: {
    name: 'Speedy Delivery',
    requirements: {
      completedJobs: 10,
      onTimeDeliveryRate: 0.95
    }
  },
  COMMUNITY_FAVORITE: {
    name: 'Community Favorite',
    requirements: {
      completedJobs: 50,
      averageRating: 4.8
    }
  }
};

class BadgeService {
  async evaluateUserBadges(userId) {
    const user = await User.findById(userId);
    const earnedBadges = [];

    for (const [badgeKey, criteria] of Object.entries(badgeCriteria)) {
      if (this.userMeetsCriteria(user, criteria.requirements)) {
        earnedBadges.push(badgeKey);
      }
    }

    return earnedBadges;
  }

  userMeetsCriteria(user, requirements) {
    // Check if user meets all requirements for a badge
    return Object.entries(requirements).every(([key, value]) => {
      switch(key) {
        case 'emailVerified':
          return user.verification.email.isVerified === value;
        case 'phoneVerified':
          return user.verification.phone.isVerified === value;
        case 'photoVerified':
          return user.verification.documents.some(d => 
            d.type === 'profile_photo' && d.status === 'verified'
          );
        case 'completedJobs':
          return user.trustScore.completedJobs >= value;
        case 'averageRating':
          return user.trustScore.averageRating >= value;
        case 'responseRate':
          return user.trustScore.responseRate >= value;
        case 'onTimeDeliveryRate':
          return user.trustScore.onTimeDeliveryRate >= value;
        default:
          return false;
      }
    });
  }
}