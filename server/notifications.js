createNotification = function(event, properties, userToNotify, userDoingAction){
  // console.log('adding new notification for:'+getDisplayName(userToNotify)+', for event:'+event);
  // console.log(userToNotify);
  // console.log(userDoingAction);
  // console.log(properties);
  if(userToNotify._id!=userDoingAction._id){
    // make sure we don't notify people of their own actions
    var notification= {
      timestamp: new Date().getTime(),
      userId: userToNotify._id,
      event: event,
      properties: properties,
      read: false
    }
    var newNotificationId=Notifications.insert(notification);

    if(userToNotify.profile && userToNotify.profile.notificationsFrequency === 1){
      Meteor.call('sendNotificationEmail', userToNotify, newNotificationId);
    }
  }
};

getUnsubscribeLink = function(user){
  return Meteor.absoluteUrl()+'unsubscribe/'+user.email_hash;
};

Meteor.methods({
  sendNotificationEmail : function(userToNotify, notificationId){
    // Note: we query the DB instead of simply passing arguments from the client
    // to make sure our email method cannot be used for spam
    var notification = Notifications.findOne(notificationId);
    var n = getNotification(notification.event, notification.properties);
    var to = getEmail(userToNotify);
    var text = n.text + '\n\n Unsubscribe from all notifications: '+getUnsubscribeLink(userToNotify);
    var html = n.html + '<br/><br/><a href="'+getUnsubscribeLink(userToNotify)+'">Unsubscribe from all notifications</a>';
    sendEmail(to, n.subject, text, html);
  },  
  unsubscribeUser : function(hash){
    // TO-DO: currently, if you have somebody's email you can unsubscribe them
    // A site-specific salt should be added to the hashing method to prevent this
    var user = Meteor.users.findOne({email_hash: hash});
    if(user){
      var update = Meteor.users.update(user._id, {
        $set: {'profile.notificationsFrequency' : 0}
      });
      return true;
    }
    return false;
  },
  notifyAdmins : function(notification){
    // send a notification to every site admin
    _.each(adminUsers(), function(element, index, list){
      sendEmail(getEmail(element), notification.subject, notification.text, notification.html);
    });
  }
});