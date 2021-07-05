const { emoji } = require('../commands/inventory/consumable.js');

const {ButtonCollector,checkListener} = (require('./ButtonCollector.js'))();
 
class Paginator extends ButtonCollector {

    constructor(botMessage, startPage, totalItems, itemsPerPage, {userMessage}){
        checkListener();
        super(botMessage, (m)=> {
            return m.userID === userMessage.author.id
        }, {idle: 60e6, time: 60e6,maxMatches:1000,removeButtons:false,preventAck:true});
        this.book = botMessage;
        this.page = startPage;
        this.total = totalItems;
        this.lastPage = Math.ceil(totalItems / itemsPerPage);
        this.rpp = itemsPerPage;
        this.userMessage = userMessage;
        this.buttonsRow = botMessage?.components?.length||0;
        
        this.VALID_BUTTONS = [
            "first",
            "previous",
            "current",
            "next",
            "last"
        ];

        //if (this.lastPage === 1) return this.stop();
        this.ready = this.book.addButtons([
                { emoji: {name:"⏪"}, label: "First", custom_id: "first", style: 2, disabled: this.page === 1 },
                { emoji: {name:"◀️"}, label: "Previous", custom_id: "previous", style: 1, disabled: this.page === 1 },
                { emoji: {name:"📄"}, label: `${this.page}/${this.lastPage}`, custom_id: "current", style: 2, disabled: true },
                { emoji: {name:"▶️"}, label: "Next", custom_id: "next", style: 1, disabled: this.page >= this.lastPage },
                { emoji: {name:"⏩"}, label: "Last", custom_id: "last", style: 2, disabled: this.page >= this.lastPage },
        ],this.buttonsRow).then(r=>{
           // this.book =r;
            return r;
        })

    

        this.on("click", async ({ interaction, id, userID, message }) => {
            console.log("click",id)
            if (!this.VALID_BUTTONS.includes(id)) {
                console.log("ALIEN",id)
               // this.book = await message.removeButtons(this.VALID_BUTTONS);
                this.buttonsRow = this.book?.components?.length||0;
                return this.stop( "Clicked Alien Button");

            }
            if (userID !== this.userMessage.author.id) {
                return interaction.reply({ content: "Shoo!", flags: 64 });
            }

            if (id === "next") this.page = Math.min(this.page + 1, this.lastPage);
            if (id === "previous") this.page = Math.max(this.page - 1, 1);
            if (id === "last") this.page = this.lastPage;
            if (id === "first") this.page = 1;
            
            await this.book.updateButtons([
                {  custom_id: "first", disabled: this.page === 1 },
                {  custom_id: "previous",  disabled: this.page === 1 },
                {  custom_id: "next", disabled: this.page >= this.lastPage },
                {  custom_id: "last", disabled: this.page >= this.lastPage },

                { custom_id: 'current', label: `${this.page}/${this.lastPage}` }
            ]).then(msg => {
                interaction.ack().catch(e=>null)
                this.book = msg;
                this.emit("page", this.book, this.page, this.rpp, this.total, interaction);
            });
        })

    }

    setPage(n) {
        this.page = n;
       // this.emit("page", this.book, this.page, this.rpp, this.total)
    }

}
module.exports = Paginator;
/*
const time = options.time || 10000;
const content = options.content || m.content?.[0] || "";
const embed = options.embed || m.embeds?.[0] || false;
const avoidEdit = options.avoidEdit || true;
const strings = options.strings || {};
strings.timeout = strings.timeout || "TIMEOUT";

const page = options.page || 1;
const totPages = options.tot_pages || 1;

const isFirst = page === 1;
const isLast = page === totPages;

if (!isFirst) m.addReaction("◀");
if (!isLast) m.addReaction("▶");

const reas = await m.awaitReactions({
  maxMatches: 1,
  authorOnly: msg.author.id,
  time,
}).catch(() => {
  m.removeReactions().catch(() => null);
  if (embed && !avoidEdit) {
    embed.color = 16499716;
    embed.footer = { text: strings.timeout };
    m.edit({ content, embed });
  }
});

if (!reas || reas.length === 0) return null;
m.removeReactions().catch(console.error);

if (!isFirst && reas.length === 1 && reas[0].emoji.name === "◀") {
  options = null;
  pagefun(page - 1, m, rec += 1);
  m = null;
  msg = null;
}

if (!isLast && reas.length === 1 && reas[0].emoji.name === "▶") {
  pagefun(page + 1, m, rec += 1);
  options = null;
  m = null;
  msg = null;
}
};/*/