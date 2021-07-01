const ButtonCollector = (require('./ButtonCollector.js'))();
class Paginator extends ButtonCollector {

    constructor(botMessage, startPage, totalItems, itemsPerPage, {userMessage}){

        super(botMessage, (m)=> {
            console.log('woa',userMessage.author.id);
            console.log('woa',m);

            m.author.id === userMessage.author.id
        }, {time: 60e6});
        this.book = botMessage;
        this.page = startPage;
        this.total = totalItems;
        this.lastPage = Math.ceil(totalItems / itemsPerPage);
        this.rpp = itemsPerPage;
        this.userMessage = userMessage;
        this.buttonsRow = botMessage.components.length;

        this.VALID_BUTTONS = [
            "first",
            "previous",            
            "next",
            "last"
        ];

        this.book.addButtons( [
            {label: "First", custom_id: "first", style:2, disabled: this.page === 1},
            {label: "Previous", custom_id: "previous", style:2, disabled: this.page === 1},
            {label: this.page, custom_id: "current", style:2, disabled: true},
            {label: "Next", custom_id: "next", style:2, disabled: this.page >= this.lastPage},
            {label: "Last", custom_id: "last", style:2, disabled: this.page >= this.lastPage},

        ],this.buttonsRow)


        this.on("click", ({interaction,id,userID,message}) => {
            console.log('click')
            if ( !this.VALID_BUTTONS.includes(id) ){
                message.removeComponentRow(this.buttonsRow);
                return this.stop("Clicked Alien Button");
            }
            if ( userID !== this.userMessage.author.id ){
                return interaction.reply({content:"Shoo!",flags:64});
            }

            if (id === "next") this.page = Math.min(this.page + 1, this.lastPage);
            if (id === "previous") this.page = Math.min(this.page - 1, 1);
            if (id === "last") this.page = this.lastPage;
            if (id === "first") this.page = 1;

            this.book.updateButtons([{custom_id:'current', label: this.page}]).then(msg=>{
                this.book = msg;
                this.emit("page", msg, this.page, this.rpp, this.total);
            });
        })

    }

    setPage(n) {
        this.page = n;
        this.emit("page", this.book, this.page, this.rpp, this.total)
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