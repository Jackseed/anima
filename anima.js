// Anima script
function states()
{
    return {

      // Init game
      100: {
        // onState: active la fonction appelée au moment où cet état se lance
          onState: 'postSetup',
          transitions: { done: 200 }
      },
      
      200: {
          onState: 'tokenToEnergyPhaseZone',
          description: _('${actplayer} has to play'),
          descriptionmyturn: _('${you} have to play'),
          possibleactions: ['selectToken'],
          transitions: { done: 201 }
      },
      
      201: {
          onState: 'checkEndOfGame',
          transitions: { done: 200 }
      },

    };
}

function postSetup() {
    // Update player names for player zones
    var players = bga.getPlayers();
    //* devrait ajouter dans le wiki à quoi ressemble un player dans la bdd & une carte
    for (var color in players) {
        player = players[color];
        //bga.cancel(color);
        
        // retrouve l'id de l'élément avec le nom des joueurs pour chaque zone 
        var labelId = null;
        if (color == 'ff0000') labelId = bga.getElement( {name: 'Red player'} );
        if (color == '008000') labelId = bga.getElement( {name: 'Green player'} );
        if (color == '0000ff') labelId = bga.getElement( {name: 'Blue player'} );
        if (color == 'ffa500') labelId = bga.getElement( {name: 'Yellow player'} );
        
        // crée un tableau avec en clé l'id des éléments "noms de zone" et en valeur le nom du joueur correspondant
        var props = [];
        props[labelId] = {name: player.name};
        // setProperties a l'air de fonctionner avec un tableau de type id => { x: y} avec { x: y} la propriété à setter
        bga.setProperties( props );
    }
    // appelle la transition "done" dans l'état 100
    bga.nextState('done');
}

function tokenToEnergyPhaseZone() {
  var tokenId = bga.getElement( {name: "Phase_token"});
  var energyPhaseZone = bga.getElement( {name: "Energy_phase_zone"});

  bga.moveTo(tokenId, energyPhaseZone);
  bga.trace(this.getActivePlayerEnergyPool());
  bga.trace(this.checkPhaseZone());
}

function getActivePlayerEnergyPool() {
    if (bga.getActivePlayerColor() == 'ff0000') return bga.getElement( {tag: 'ENERGY_POOL_RED'}, 'value');
    if (bga.getActivePlayerColor() == '008000') return bga.getElement( {tag: 'ENERGY_POOL_GREEN'}, 'value');
    if (bga.getActivePlayerColor() == '0000ff') return bga.getElement( {tag: 'ENERGY_POOL_BLUE'}, 'value');
    if (bga.getActivePlayerColor() == 'ffa500') return bga.getElement( {tag: 'ENERGY_POOL_YELLOW'},'value');
    return null;
}

function checkEndOfGame() {
    var isGameEnd = (this.getActivePlayerEnergyPool() >= 25);

    if (!isGameEnd) {
    bga.nextState('done');
    } else {
       // End game
    bga.endGame();
    }
}

function onPhaseTokenClick(element_id) {
  var zoneParentId = bga.getElement( {id: element_id}, 'parent');
  var zoneParentName = bga.getElement({id: zoneParentId}, 'name');

  bga.checkAction('selectToken');

  switch (zoneParentName) {
    case 'Energy_phase_zone':
    bga.log("you're in energy phase, and that's so cooool!");
    break;
    case 'Buying_phase_zone':
    bga.log("you're in buying phase, give me your money!");
    break;
    case 'Killing_phase_zone':
    bga.log("you're in killing phase, please calm the fuck down...");
    break;
    case 'Feeding_phase_zone':
    bga.log("you're in feeding phase, a not fed animal is a dead animal.");
    break;
    case 'End_of_turn_phase_zone':
    bga.log("you're in end of turn, that don't make any sense but we don't care.");
    break;
  }
}

