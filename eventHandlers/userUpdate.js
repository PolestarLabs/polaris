module.exports = async (user, old) => {
    if(user.id==='88120564400553984'){
        console.log("USER CHANGE")
    }
    PLX.redis.set(`discord.users.${user.id}`, JSON.stringify(user) ); 
  };
  