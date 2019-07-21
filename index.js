/*
var memeArray = [
    {"creatorName": "Alice", "memeUrl": "https://i.kym-cdn.com/entries/icons/original/000/028/075/nu_doge_thumb.png","votes":18,"index":"13"},
    {"creatorName": "Bob", "memeUrl": "https://static1.infranken.de/storage/image/0/4/8/6/3196840_slider-detail-1080w_1sTFli_eVe52f.jpg","votes":27,"index":"22"},
    {"creatorName": "Carol", "memeUrl": "https://pics.me.me/tired-of-the-wrongly-used-confession-bear-meme-thats-all-41112597.png","votes":14,"index":"14"}
];
*/
const contractSource = `
  contract MemeVote = 

  record meme = 
    { creatorAddress : address,
      url            : string,
      name           : string,
      voteCount      : int }

  record state = 
    { memes      : map(int, meme),
      memesLength : int }

  entrypoint init() = 
    { memes = {},
      memesLength = 0 }

  entrypoint getMeme(index : int) : meme =
    switch(Map.lookup(index, state.memes))
      None    => abort("There was no meme with this index registered.")
      Some(x) => x
    
  stateful entrypoint registerMeme(url' : string, name' : string) =
    let meme = { creatorAddress = Call.caller, url = url', name = name', voteCount = 0}
    let index = getMemesLength() + 1
    put(state{ memes[index] = meme, memesLength = index })
    
  entrypoint getMemesLength() : int =
    state.memesLength
    
  stateful entrypoint voteMeme(index : int) =
    let meme = getMeme(index)
    Chain.spend(meme.creatorAddress, Call.value)
    let updatedVoteCount = meme.voteCount + Call.value
    let updatedMemes = state.memes{ [index].voteCount = updatedVoteCount }
    put(state{ memes = updatedMemes })
    `;

const contractAddress = 'ct_ndGUPAmujkRLE46Qsn6WYApyJ5w5XYQe5XfbfQZBLAGgzQVNx';
var client = null;
var memeArray = [];
var memesLength = 0;

function renderMemes() {
  memeArray = memeArray.sort(function(a,b){return b.votes-a.votes})
  var template = $('#template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {memeArray});
  $('#memeBody').html(rendered);
}

window.addEventListener('load', async () => {
  $("#loader").show();

  client = await Ae.Aepp();

  const contract = await client.getContractInstance(contractSource, {contractAddress});
  const calledGet = await contract.call('getMemesLength', [], {callStatic: true}).catch(e => console.error(e));
  console.log('calledGet', calledGet);

  const decodedGet = await calledGet.decode().catch(e => console.error(e));
  console.log('decodedGet', decodedGet);

  renderMemes();

  $("#loader").hide();
});

jQuery("#memeBody").on("click", ".voteBtn", async function(event){
  const value = $(this).siblings('input').val();
  const dataIndex = event.target.id;
  const foundIndex = memeArray.findIndex(meme => meme.index == dataIndex);
  memeArray[foundIndex].votes += parseInt(value, 10);
  renderMemes();
});

$('#registerBtn').click(async function(){
  var name = ($('#regName').val()),
      url = ($('#regUrl').val());

  memeArray.push({
    creatorName: name,
    memeUrl: url,
    index: memeArray.length+1,
    votes: 0
  })
  
  renderMemes();
});
