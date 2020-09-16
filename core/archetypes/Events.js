const ongoing = null;
const boxIdentification = null;
const boxPicture = null;
const eventDetails = ongoing ? require(`../../funfest/clockwork/${ongoing}`) : null;

module.exports = {
  ongoing,
  box_identification: boxIdentification,
  box_picture: boxPicture,
  event_details: eventDetails,
};
