module.exports = async (member, oldPres) => {
  if (!PLX?.isPRIME) return;

  if (member.guild.id === '206252981895692289') {



    if (member.id === '200044537270370313') {

      if (member.activities[0]?.state?.toLowerCase() === "dead") {
        PLX.createMessage("942520060726108240", `
        <@${"200044537270370313"}> Se fudeu KKKK 
        `);
      }
    }
    if (member.id === '225707076947673088') {
      console.log('edza');

      if (member.activities[0]?.state?.toLowerCase() === "dead") {
        PLX.createMessage("942520060726108240", `
        <@${"225707076947673088"}> Se fudeu KKKK 
        `);
      }
    }
  }
};
