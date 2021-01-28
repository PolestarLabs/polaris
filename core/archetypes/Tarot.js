const ARCANA = [
  {"id":"fool","index":0,"arcana":"The Fool","UPRIGHT":{"SCORE":["-1","0","1"],"KEYWORDS":"Beginnings, innocence, spontaneity, a free spirit.","START":"With new beginnings ahead, you are at the outset of your journey, staring the cliff's edge","MID":"The time is NOW! Take that leap of faith, even if you do not feel 100% ready or equipped for what is coming. Seriously, what are you waiting for?","END":"You never know what the future holds, but like the Fool, you must step into the unknown, trusting that the Universe will catch you and escort you along the way. Take a chance and see what happens!"},"REVERSED":{"SCORE":["0","1","-1"],"KEYWORDS":"Holding back, recklessness, risk-taking.","START":"You may fear the unknown, wondering: \"what am I getting myself into?\". As a result, you have come to a standstill, worried about taking any action where you don’t know the outcome","MID":"In your attempt to live ‘in the moment’ and be spontaneous and adventurous, you may do so in total disregard of the consequences of your actions and engaging in activities that put both yourself and others at risk. ","END":"Look at how you can bring more play into your daily life, even if you start out by doing it in private."}},
  {"id":"magician","index":1,"arcana":"The Magician","UPRIGHT":{"SCORE":["-2","1","2"],"KEYWORDS":"Manifestation, resourcefulness, power, inspired action.","START":"Everything you need right now is at your fingertips, seriously. ","MID":"In your quest to manifest your goals, you must establish a clear vision of what you will create before you act.","END":"When you are clear about your \"what\" and your \"why\", the Magician calls on you to take inpired action."},"REVERSED":{"SCORE":["1","2","-2"],"KEYWORDS":"Manipulation, poor planning, untapped talents.","START":"The reversed Magician shows you are exploring what you wish to manifest, but you are not taking action yet.","MID":"You are uncertain if you have everything you need and may be unsure about how to make it happen.","END":"If you take care of what you intend to manifest, the Universe will work out the how."}},
  {"id":"hipriestess","index":2,"arcana":"The High Priestess","UPRIGHT":{"SCORE":["-3","2","3"],"KEYWORDS":"Intuition, sacred knowledge, divine feminine, the subconscious mind.","START":"Now is the time to be still so you can tune in to your intuition.","MID":"The answers you are seeking will come from within, from your deepest truth and \"knowing\".","END":"Allow the High Priestess to become your guide as you venture deep into your subconscious mind and access the inner wisdom."},"REVERSED":{"SCORE":["2","3","-3"],"KEYWORDS":"Secrets, disconnecedt from intuition, withdrawal and silence.","START":"You may be swayed by others people's opinions or swept up in their drama when what you really need to do is focus on what is right for you. ","MID":"It's time to get quiet and withdraw yourself from the external world to observe what your inner guidance is sharing with you now.","END":"Others may be keeping information from you or talking about you behind your back and sharing mistruths."}},
  {"id":"empress","index":3,"arcana":"The Empress","UPRIGHT":{"SCORE":["-4","3","4"],"KEYWORDS":"Femininity, beauty, nature, nurturing, abundance.","START":"The Empress calls on you to connect with your feminine energy. Create beauty in your life. Connect with your senses through taste, touch, sound, smell and sight. ","MID":"You are surrounded by life’s pleasures and luxuries and have everything you need to live a comfortable lifestyle.","END":"You are in a period of growth, in which all you have dreamed of is now coming to fruition. "},"REVERSED":{"SCORE":["3","4","-4"],"KEYWORDS":"Creative block, dependence of others.","START":"The Empress reversed can suggest that you are feeling a creative block, especially in ‘birthing’ a new idea or expressing yourself creatively.","MID":"You may worry whether it will be a success or if your work is appealing to others.","END":"For now, don’t bother about what others think. The important thing is that you are allowing your creative energy to flow, even if it means keeping your newest creations private to you only (and even if they look like a three-year-old created them!)."}},
  {"id":"emperor","index":4,"arcana":"The Emperor","UPRIGHT":{"SCORE":["-5","4","5"],"KEYWORDS":"Authority, establishment, structure, a father figure.","START":"Status, power and recognition are essential to you, and you are most comfortable in a leadership role where you can command and direct others.","MID":"You have a clear vision of what you want to create, and you organise those around you to manifest your goal. ","END":"Through the course of your life, you have gained valuable wisdom and life experience, and now you enjoy offering guidance, advice, and direction to someone who might benefit from it."},"REVERSED":{"SCORE":["4","5","-5"],"KEYWORDS":"Domination, excessive control, lack of discipline, inflexibility.","START":"You may need to get a little tough on yourself and do the uncomfortable work you’d prefer to avoid.","MID":"Consider the role that power plays in your life. Are you asserting your power and dominance in a way that leaves others feeling powerless?","END":"Power can be equally and constructively distributed – you don’t need to take it from others, nor do you need to give yours away."}},
  {"id":"hiero","index":5,"arcana":"The Hierophant","UPRIGHT":{"SCORE":["-6","5","6"],"KEYWORDS":"Spiritual wisdom, religious beliefs, conformity, tradition, institutions.","START":"Work with a teacher, mentor, or guide to teach you about spiritual values and beliefs in a structured way.","MID":"You are being asked to commit to spiritual practice in its most wholesome form – no customisation, no adaptation, no bending the rules. ","END":"You may enjoy a deep sense of comfort being surrounded by people who have well-established belief systems and explicit values."},"REVERSED":{"SCORE":["5","6","-6"],"KEYWORDS":"Personal beliefs, freedom, challenging the status quo.","START":"All the wisdom you seek comes from within – not from some external source or power.","MID":"You are being guided to follow your own path and adopt your own spiritual belief systems rather than blindly following others’. ","END":"Others may question your motivations to go against tradition, but you know deep within that now is the time."}},
  {"id":"lovers","index":6,"arcana":"The Lovers","UPRIGHT":{"SCORE":["-7","6","7"],"KEYWORDS":"Love, harmony, relationships, values alignment, choices.","START":"You may believe you have found your soul mate or life partner, and the sexual energy between you both goes way beyond instant gratification and lust to something that is very spiritual and almost Tantric. Wow! Hot hot hot!","MID":"You are now ready to establish your belief system and decide what is and what is not essential to you.","END":"It’s time to go into the big wide world and make choices for yourself, staying true to who you are and being authentic and genuine in all your endeavours."},"REVERSED":{"SCORE":["6","7","-7"],"KEYWORDS":"Self-love, disharmony, imbalance, misalignment of values.","START":"Instead of making a decision based on your values, you feel tempted to cut corners and avoid responsibility for your actions.","MID":"You may find your relationships are strained and communication is challenging. Does it seem as if you are just not on the same page and no longer share the same values?","END":"You may be reluctant to open your heart to the relationship for fear of getting hurt."}},
  {"id":"chariot","index":7,"arcana":"The Chariot","UPRIGHT":{"SCORE":["-8","7","8"],"KEYWORDS":"Control, willpower, success, action, determination.","START":"You have discovered how to make decisions in alignment with your values and now you are taking action on those decisions.","MID":"Now isn’t the time to be passive in the hope that things will work out in your favour. Take focused action and stick to the course, no matter what challenges may come your way – because, believe me, there will be challenges.","END":"When you apply discipline, commitment and willpower to achieve your goals, you will succeed."},"REVERSED":{"SCORE":["7","8","-8"],"KEYWORDS":"Self-discipline, opposition, lack of direction.","START":"You might bang your head against a brick wall, trying to push a project forward when really, you ought to back off or change direction.","MID":"If something is not moving forward as you planned, re-evaluate the situation and check in to see if it’s a sign that you need to change course.","END":"Ask yourself: Is there a deeper reason things have become more challenging? What lesson can I learn here?"}},
  {"id":"strength","index":8,"arcana":"Strength","UPRIGHT":{"SCORE":["-9","8","9"],"KEYWORDS":"Strength, courage, persuasion, influence, compassion.","START":"You have great stamina and persistence, balanced with underlying patience and inner calm. ","MID":"If you have been going through a rough time and are burnt out or stressed, the Strength card encourages you to find the power within yourself to persevere. ","END":"Your strength gives you the confidence to overcome any growing fears, challenges or doubts. Feel the fear and do it anyway!"},"REVERSED":{"SCORE":["8","9","-9"],"KEYWORDS":"Inner strength, self-doubt, low energy, raw emotion.","START":"Check in on your energy levels right now. You may be sluggish, particularly if you have been dedicating yourself to serving others or have been pushing hard to achieve a goal. ","MID":"You may hold more strength and resilience than you give yourself credit for – so, be kind to yourself.","END":"Know that your core strength will always be with you and now is as good a time as any to reconnect with this power."}},
  {"id":"hermit","index":9,"arcana":"The Hermit","UPRIGHT":{"SCORE":["-10","9","10"],"KEYWORDS":"Soul-searching, introspection, being alone, inner guidance.","START":"You are taking a break from everyday life to draw your energy and attention inward and find the answers you seek, deep within your soul. ","MID":"You realise that your most profound sense of truth and knowledge is within yourself and not in the distractions of the outside world. ","END":"Now is the perfect time to go on a weekend retreat or sacred pilgrimage, anything in which you can contemplate your motivations, personal values and principles, and get closer to your authentic self."},"REVERSED":{"SCORE":["9","10","-10"],"KEYWORDS":"Isolation, loneliness, withdrawal.","START":"It is time to go deeper into your inner being and rediscover your greater purpose on this earth.","MID":"You may have been so busy dealing with the day-to-day issues that you have forgotten to listen to your inner voice.","END":"The Hermit asks you to search deep within your soul to help you find your way again and focus on rebuilding yourself on a spiritual level."}},
  {"id":"wheel","index":10,"arcana":"Wheel of Fortune","UPRIGHT":{"SCORE":["RNG:-10:10","RNG:-10:10","RNG:-10:10"],"KEYWORDS":"Good luck, karma, life cycles, destiny, a turning point.","START":"If you’re going through a difficult time rest assured that it will get better from here. Good luck and good fortune will make their return in time. ","MID":"Be open to the help of others, too, as guidance from both the physical and spiritual realms is supporting you along your journey.","END":"The Wheel of Fortune card asks you to be optimistic and have faith that the Universe will take care of your situation in the best way possible."},"REVERSED":{"SCORE":["RNG:-100:100","RNG:-100:100","RNG:-100:100"],"KEYWORDS":"Bad luck, resistance to change, breaking cycles.","START":" You may experience unexpected change or negative forces could be at play, leaving you helpless. ","MID":"You have a choice: you can do nothing and hope things will get better, or you can act to improve your situation.","END":"See this moment as your opportunity to take control of your destiny and get your life back on track."}},
  {"id":"justice","index":11,"arcana":"Justice","UPRIGHT":{"SCORE":["-12","11","12"],"KEYWORDS":"Justice, fairness, truth, cause and effect, law.","START":"You are being called to account for your actions and will be judged accordingly.","MID":"A level of compassion and understanding accompany Justice, and although you may have done something you regret, this card suggests that you will be treated fairly and without bias.","END":"Be ready to take responsibility for your actions and stand accountable for the ensuing consequences."},"REVERSED":{"SCORE":["11","12","-12"],"KEYWORDS":"Unfairness, lack of accountability, dishonesty.","START":"You may be evaluating your every move and coming down hard on yourself when you misstep.","MID":"Show yourself a bit of kindness and compassion, knowing we all make mistakes.","END":"Thank your inner critic for bringing this private judgement to your conscious awareness, and trust you can now clear it away."}},
  {"id":"hanged","index":12,"arcana":"The Hanged Man","UPRIGHT":{"SCORE":["-13","12","13"],"KEYWORDS":"Pause, surrender, letting go, new perspectives.","START":"Remind yourself that sometimes you have to put everything on hold before you can take the next step, or the Universe will do it on your behalf (and it may not always be at the most convenient time!). ","MID":"You may have heard the saying, ‘What got you here won’t get you there’, and that indeed is at play in this card.","END":"Here’s the thing. These ‘pauses’ can be voluntary or involuntary. If you’re in tune with your intuition, you’ll start to have a sense for when it’s time to hit the brakes and put things on hold – before things get out of hand."},"REVERSED":{"SCORE":["12","13","-13"],"KEYWORDS":"Delays, resistance, stalling, indecision.","START":"Your spirit and body are asking you to slow down, but your mind keeps racing. Stop and rest before it’s too late.","MID":"While you feel resistant, it’s important that you surrender to ‘what is’ and let go of your attachment to how things should be. ","END":" Be in flow with life, even if it’s not as you expected it (seriously, when does it ever go exactly as you expected!?), and loosen your grip."}},
  {"id":"death","index":13,"arcana":"Death","UPRIGHT":{"SCORE":["-14","13","14"],"KEYWORDS":"Endings, change, transformation, transition.","START":"You must close one door to open another. You need to put the past behind you and part ways, ready to embrace new opportunities and possibilities.","MID":" It may be difficult to let go of the past, but you will soon see its importance and the promise of renewal and transformation.","END":"If you resist these necessary endings, you may experience pain, both emotionally and physically, but if you exercise your imagination and visualise a new possibility, you allow more constructive patterns to emerge."},"REVERSED":{"SCORE":["13","14","-14"],"KEYWORDS":"Resistance to change, personal transformation, inner purging.","START":"See what wonderful possibilities become available to you as you say ‘yes’ to change. As you learn to release the past and surrender to the present, the future becomes even brighter.","MID":"To support the process, repeat this affirmation: “I embrace change in all forms.”","END":"You may not want to share this with others just yet – wait until your personal transformation has occurred, then share your story as a source of inspiration."}},
  {"id":"temper","index":14,"arcana":"Temperance","UPRIGHT":{"SCORE":["-15","14","15"],"KEYWORDS":"Balance, moderation, patience, purpose.","START":"You are being invited to stabilise your energy and to allow the life force to flow through you without force or resistance.","MID":"It’s time to recover your flow and get your life back into order and balance.","END":"Your respect for balance and tranquillity is what will help you achieve and experience fulfilment in your life."},"REVERSED":{"SCORE":["14","15","-15"],"KEYWORDS":"Imbalance, excess, self-healing, re-alignment.","START":"You may have been over-eating, regularly drinking, buying things you can’t afford, arguing with loved ones, or engaging in negative thought patterns. Stop it!","MID":"These activities are taking you further away from who you are and what you are here to do. ","END":"As they say, “Everything in moderation!” Or, you may find you need 100% abstinence to break this negative cycle and bring your life back into balance again."}},
  {"id":"devil","index":15,"arcana":"The Devil","UPRIGHT":{"SCORE":["-16","15","16"],"KEYWORDS":"Shadow self, attachment, addiction, restriction, sexuality.","START":"The Devil card represents your shadow (or darker) side and the negative forces that constrain you and hold you back from being the best version of yourself.","MID":"You have found yourself trapped between the short-term pleasure you receive and the longer-term pain you experience.","END":"With the Devil, you are choosing the path of instant gratification, even if it is at the expense of your long-term well-being. In effect, you have sold your soul to the devil!"},"REVERSED":{"SCORE":["15","16","-16"],"KEYWORDS":"Releasing limiting beliefs, exploring dark thoughts, detachment.","START":"You are on the verge of a break-through or an up-levelling.","MID":"You are being called to your highest potential, but first, you must let go of any unhealthy attachments or limiting beliefs that may hold you back.","END":"Let go of fear and release any self-imposed limiting beliefs standing in the way of your growth. It is easier than you realise."}},
  {"id":"tower","index":16,"arcana":"The Tower","UPRIGHT":{"SCORE":["-17","16","17"],"KEYWORDS":"Sudden change, upheaval, chaos, revelation, awakening.","START":"Expect the unexpected – massive change, upheaval, destruction and chaos.","MID":"A lightning bolt of clarity and insight cuts through the lies and illusions you have been telling yourself, and now the truth comes to light. ","END":"There’s no escaping it. Change is here to tear things up, create chaos and destroy everything in its path (but trust me, it’s for your Highest Good)."},"REVERSED":{"SCORE":["16","17","-17"],"KEYWORDS":"Personal transformation, fear of change, averting disaster.","START":"You are instigating the change and calling into question your fundamental belief systems, values, purpose and meaning.","MID":"You may go through a spiritual awakening as you discover a new spiritual path. You may change your beliefs and opinions about important topics, realising that you can no longer support older models.","END":"You are creating change and transformation so you can step into a new and evolved version of yourself."}},
  {"id":"star","index":17,"arcana":"The Star","UPRIGHT":{"SCORE":["-18","17","18"],"KEYWORDS":"Hope, faith, purpose, renewal, spirituality.","START":"You have endured many challenges and stripped yourself bare of any limiting beliefs that have previously held you back. ","MID":"No matter what life throws your way, you know that you are always connected to the Divine and pure loving energy. ","END":"You hold a new sense of self, a new appreciation for the core of your Being."},"REVERSED":{"SCORE":["17","18","-18"],"KEYWORDS":"Lack of faith, despair, self-trust, disconnection.","START":"You may be feeling overwhelmed by life’s challenges right now and questioning why you are being put through this.","MID":"You know life throws curveballs, but really? Why this, and why now?! You may be desperately calling out to the Universe to give you some reprieve but struggling to see how the Divine is on your side.","END":"Look harder, and you will see it. The Divine is always there. Take a moment to ask yourself what the deeper life lesson is, and how this is a blessing, not a punishment."}},
  {"id":"moon","index":18,"arcana":"The Moon","UPRIGHT":{"SCORE":["-19","18","19"],"KEYWORDS":"Illusion, fear, anxiety, subconscious, intuition.","START":"You may have a painful memory that caused emotional distress, and rather than dealing with the emotions you pushed them down deep into your subconscious.","MID":"Now, these emotions are making a reappearance, and you may find yourself under their influence on a conscious or subconscious level.","END":"Be careful of making fast decisions when the Moon appears because you may later realise you only had half the information you needed."},"REVERSED":{"SCORE":["18","19","-19"],"KEYWORDS":"Release of fear, repressed emotion, inner confusion.","START":"You have been dealing with illusion, fears and anxiety, and now the negative influences of these energies are subsiding.","MID":"You are working through your fears and anxieties, understanding the impact they have on your life and how you can free yourself from such limiting beliefs. This is a truly liberating and transformational experience.","END":"Trust that the answers you need are already within you, and tune in to your inner guidance system to hear those answers."}},
  {"id":"sun","index":19,"arcana":"The Sun","UPRIGHT":{"SCORE":["-20","19","20"],"KEYWORDS":"Positivity, fun, warmth, success, vitality.","START":"The Sun gives you strength and tells you that no matter where you go or what you do, your positive and radiant energy will follow you and bring you happiness and joy.","MID":"People are drawn to you because you can always see the bright side and bring such warmth into other people’s lives. This beautiful, warm energy is what will get you through the tough times and help you succeed.","END":"You are in a position where you can share your highest qualities and achievements with others. Radiate who you are and what you stand for; shine your love on those you care about."},"REVERSED":{"SCORE":["19","20","-20"],"KEYWORDS":"Inner child, feeling down, overly optimistic.","START":"The reversed Sun is calling to your inner child to come out and play!","MID":"When you see the Sun reversed in your Tarot reading, see it as your permission slip to leave behind your work and responsibilities, even just for a moment, and play.","END":"The Sun is never a negative card, so this is only temporary. The obstacles you see can be easily removed if you put your mind to it. It may just take a bit more effort than usual."}},
  {"id":"judge","index":20,"arcana":"Judgement","UPRIGHT":{"SCORE":["-21","20","21"],"KEYWORDS":"Judgement, rebirth, inner calling, absolution.","START":"You are experiencing a spiritual awakening and realising that you are destined for so much more. This is your cosmic up-levelling! ","MID":"You hear the call and are ready to act. Tune in to a higher frequency. Let go of your old self and step into this newest version of who you really are.","END":"If you still need clarity on the situation, look to your past and life lessons to guide you."},"REVERSED":{"SCORE":["20","21","-21"],"KEYWORDS":"Self-doubt, inner critic, ignoring the call.","START":"You are doing your best to pretend you didn’t receive ~ the call ~ and are carrying on with your daily life, hoping it will go away. But let’s be honest – the ‘call’ never goes away; it just gets louder and louder until you pay attention.","MID":"Through meditation or quiet contemplation, you may arrive at a deep understanding of the universal themes weaving throughout your life and what you can do or change to avoid these situations.","END":"It’s time to push past your inner fears and self-doubt, and trust that the Universe has your back. This is happening for a reason."}},
  {"id":"zawarudo","index":21,"arcana":"The World","UPRIGHT":{"SCORE":["-22","21","22"],"KEYWORDS":"Completion, integration, accomplishment, travel.","START":"A long-term project, period of study, relationship or career has come full circle, and you are now revelling in the sense of closure and accomplishment.","MID":"All the triumphs and tribulations along your path have made you into the strong, wise, more experienced person you are now.","END":"Now, the World card invites you to reflect on your journey, honour your achievements and tune into your spiritual lessons. Celebrate your successes and bask in the joy of having brought your goals to fruition."},"REVERSED":{"SCORE":["21","22","-22"],"KEYWORDS":"Seeking personal closure, short-cuts, delays.","START":"The reversed World card suggests that you are seeking closure on a personal issue. Perhaps you are still emotionally attached to a past relationship and want to move on.","MID":"You know, deep down, that to accept and embrace where you are now, you need to let go of the past and move on.","END":"Finding closure may be an intensely personal journey – something you manage through journaling, visualisation, energy work, and therapy."}}
 ]

const DAY =  22 * 60 * 60e3;


const Picto = require("../utilities/Picto");
const { TimedUsage } = require("@polestar/timed-usage");
const { _cardValue } = require("./Blackjack");






class Tarot {
  constructor(msg = {}, spreadSize = 3) {
    this._deck = Tarot._shuffle(ARCANA);
    this.L = msg.lang || ["en"];
    this.spread = this.getSpread(spreadSize > 9 ? 9 : spreadSize);
  }

  getSpread(size) {
    let i = size;
    const spread = [];
    while (i--) {
      this._deck = Tarot._shuffle(this._deck);
      spread.push({ card: this._deck.pop(), pose: Tarot._pos() });
    }
    return spread;
  }

  async drawCard(card, pos, deck = "persona3") {
    const cardCanvas = Picto.new(200, 350);
    const ctx = cardCanvas.getContext("2d");
    const cardPic = await Picto.getCanvas(`${paths.CDN}/build/cards/tarot/${deck}/${card.id}.png`);
    const posname = Picto.tag(ctx, pos, "400 20px Panton", "#A5A5A3");
    Picto.setAndDraw(ctx, posname, 100, 20, 180, "center");
    const arcaname = Picto.tag(ctx, card.arcana, "900 24px Panton");
    Picto.setAndDraw(ctx, arcaname, 100, 310, 180, "center");

    if (pos === "REVERSED") {
      ctx.translate(200, 350);
      ctx.scale(-1, -1);
    }
    ctx.drawImage(cardPic, 25, 50, 150, 250);
    return cardCanvas;
  }

  async drawSpread(skin) {
    const spSize = this.spread.length;
    const canvas = Picto.new(200 * spSize, 350);
    const ctx = canvas.getContext("2d");

    await Promise.all(this.spread.map((currSpd, i) => this.drawCard(currSpd.card, currSpd.pose, skin).then((c) => ctx.drawImage(c, (spSize - i - 1) * 200, 0))));

    return canvas;
  }

  get readings(){
    return this.spread.map((draw,i,a)=> {
      const {card,pose:POSITION} = draw;
      if(i === 0) return card[POSITION].START;
      if(i === a.length-1) return card[POSITION].END;
      return card[POSITION].MID;
    })
  }

  get keywords(){
    return this.spread.map((draw,i,a)=> {
      const {card,pose:POSITION} = draw;
      return card[POSITION].KEYWORDS;
    })
  }
  get scores(){
    return this.spread.map((draw,i)=> {
      const {card,pose:POSITION} = draw;
      return card[POSITION].SCORE[i];
    }).map(value=>{
      const [,MIN,MAX] = value.split(":").map(x=>parseInt(x));
      if(value.includes("RNG")) value = randomize(MIN,MAX);
      return value;
    })
  }

  async luckyScore(user){
    const timed = await new TimedUsage("tarot", { day: DAY }).loadUser(user);
    if (timed.dailyAvailable){
      let myScore = this.scores.reduce((a,b)=>a+b);
      DB.users.set(user.id,{
        $set:{"counters.tarot.luckyScore": myScore}
      })

    }else{
      timed.availableAt
    }
  }


  static _shuffle(array) {
    const newArray = array.slice();
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = newArray[i];
      newArray[i] = newArray[j];
      newArray[j] = temp;
    }
    return newArray;
  }
  

  static _pos() {
    const r = Math.floor(Math.random() * 10 + 1);
    return r % 2 === 0 ? "UPRIGHT" : "REVERSED";
  }
}

module.exports = Tarot;
