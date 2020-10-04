
const ONGOING = "halloween";

const boxIdentification = null;
const boxPicture = null;
const eventDetails = ONGOING ? require(`../events/clockwork/${ONGOING}`) : null;

module.exports = {
  ongoing: ONGOING,
  box_identification: boxIdentification,
  box_picture: boxPicture,
  event_details: eventDetails,
};
