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
          possibleactions: ['selectToken','selectCard'],
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
  var test_card_energy_cost = bga.getElement ({name: "Test_card"}, 'c_energyCost');

  bga.moveTo(tokenId, energyPhaseZone);
  bga.log(this.getActivePlayerEnergyPool());
  bga.log(test_card_energy_cost);
  this.checkEndOfGame();
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
    return;
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

function onClickCard( card_id, selection_ids ) {
    // Cancel event propagation
    bga.stopEvent();
    
    var card_order = bga.getElement( {id: card_id}, "c_order");
    var parent_id = bga.getElement( {id: card_id}, 'parent' );
    var parent_name = bga.getElement( {id: parent_id}, 'name');
    var card_parent = bga.getElement( {id: parent_id}, ['id','name','tags','howToArrange'] );
    var phase_token_id = bga.getElement( {name: 'Phase_token'});
    var phase_token_zone = bga.getElement ( {id: phase_token_id}, 'parent');
    var active_phase_zone_name = bga.getElement ( {id: phase_token_zone}, 'name');
    var clickedColor = null;
      for (var i = 0; i < card_parent.tags.length; i++) {
        if(card_parent.tags[i] === 'RED') clickedColor = 'RED';
        if(card_parent.tags[i] === 'GREEN') clickedColor = 'GREEN';
        if(card_parent.tags[i] === 'BLUE') clickedColor = 'BLUE';
        if(card_parent.tags[i] === 'YELLOW') clickedColor = 'YELLOW';
      }
    bga.log(clickedColor);

    var explicitActiveColor = null;
    if (bga.getActivePlayerColor() == 'ff0000') explicitActiveColor = 'RED';
    if (bga.getActivePlayerColor() == '008000') explicitActiveColor = 'GREEN';
    if (bga.getActivePlayerColor() == '0000ff') explicitActiveColor = 'BLUE';
    if (bga.getActivePlayerColor() == 'ffa500') explicitActiveColor = 'YELLOW';

    var selected_card_id = this.getSelectedCard();
    var selected_card_order = null;
    if (selected_card_id !== null) selected_card_order = bga.getElement( {id: selected_card_id}, "c_order");
    
    // Check play action
    bga.checkAction('selectCard');
    
    // check if the card clicked is on a board
    if (bga.hasTag(parent_id, 'BOARD')) {
      if (!bga.hasTag(parent_id, 'BOARD_'+ explicitActiveColor )) {
        bga.cancel( _('You have to chose a card you control') );      
      } else {
          switch (active_phase_zone_name) {
            case 'Energy_phase_zone':
              if (bga.hasTag(card_id, 'SPECIAL_EFFECT')) {
                bga.log("not yet...");
              } else {
                bga.cancel( _("This card has not any effect."));
              }
              break;
            case 'Buying_phase_zone':
              if (bga.hasTag(card_id, 'SPECIAL_EFFECT')) {
                bga.log("not yet...");
              } else {
                bga.cancel( _("You have to select a card from the evolution line."));
              }
              break;
            case 'Killing_phase_zone':
              // in any case, should select the card clicked and deselect the one clicked before, if any
              bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
              bga.addStyle( card_id, 'selected' );
              break;
            case 'Feeding_phase_zone':
              if (bga.hasTag(card_id, 'SPECIAL_EFFECT')) {
                bga.log("not yet...");
              } else {
                bga.cancel( _("This card has not any effect."));
                break;
              }
          }
        }
    } 
   
   // Cas où la carte est dans le cimietière (visible ou non)
    if (bga.hasTag(parent_id, 'COUNT_GRAVEYARD_RED') || bga.hasTag(parent_id, 'COUNT_GRAVEYARD_GREEN') || bga.hasTag(parent_id, 'COUNT_GRAVEYARD_BLUE') || bga.hasTag(parent_id, 'COUNT_GRAVEYARD_YELLOW') ){
    
      // cas où le cimetière n'est pas visible
      if (card_parent.howToArrange === 'stacked') {
        // Cas où aucune carte n'est sélectionnée
        if (selected_card_id === null) {
          // Expand collected cards
          // cards_id = toutes les cartes du cimetière
            var cards_ids = bga.getElementsArray( {parent: card_parent.id} );
            var expand_id = bga.getElement( {tag: 'EXPAND_GRAVEYARD_'+ clickedColor } );

          // crée la zone où les cartes du cimetière seront visibles    
          var props = [];
          props[expand_id] = {
            x: 250, 
            y: 130, 
            width:700, 
            height:500, 
            visible: 'player'+bga.getActivePlayerColor(), 
            howToArrange: 'spreaded', 
            inlineStyle: 'background-color: rgba(255, 255, 255, 0.8)'
          };
          
          bga.setProperties( props );
          
          // déplace les cartes du cimetière sur la nouvelle zone
          bga.moveTo( cards_ids, expand_id );
              
          // Flip cards 
          bga.pause( 1500 );
          for (var j = 0; j < cards_ids.length; j++) {
          bga.flip( cards_ids[j] );
          }
        } else {
        // Cas où une carte a été précédemment sélectionnée
        // la déplace au cimetière si phase 3
            if ((bga.hasTag(parent_id, 'GRAVEYARD_'+explicitActiveColor)) && (active_phase_zone_name === 'Killing_phase_zone')) {
              bga.moveTo(selected_card_id, parent_id);
            } else {
        // ne peut pas être fait sinon
              bga.cancel( _('You cannot play this card here.') );
            }
        }
      }

      // Cas où le cimetière est visible (ne peut pas avoir sélectionné de carte au préalable)
      if (card_parent.howToArrange === 'spreaded') {
        // Cas où il s'agit de son cimetière visible, en phase 2 et que la cart est esprit, possibilité de la ressuciter
        if ( (bga.hasTag(parent_id,'EXPAND_GRAVEYARD_'+ explicitActiveColor)) && (active_phase_zone_name === 'Buying_phase_zone') && (card_order === "SPIRIT")) {
            bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
            bga.addStyle( card_id, 'selected' );
        } else {
        // sinon referme le cimetière en mode invisible

        //  retourne les cartes face cachées     
            var cards_ids = bga.getElementsArray( {parent: card_parent.id} );
            for (var j = 0; j < cards_ids.length; j++) {
                    bga.flip( cards_ids[j] );
            }
            
            bga.pause( 1500 );
            
            // Collapse collected cards
            var collapsed_id = bga.getElement( {tag: 'GRAVEYARD_' + clickedColor} );
            
            // remet à sa place le cimetière étendu
            var props = [];
            props[card_parent.id] = {
              x: 0, 
              y: 690, 
              width:226, 
              height:180, 
              visible: 'everyone', 
              howToArrange: 'stacked',
              inlineStyle: 'background-color: transparent'
            };

            bga.setProperties( props );
            
            bga.moveTo( cards_ids, collapsed_id );
            
            return;
          }
      }
    }
    
    if (bga.hasTag(parent_id, 'EVOLUTION_LINE')) {
      bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
      bga.addStyle( card_id, 'selected' );      
    }
}

function getSelectedCard() {
    var selected_cards = bga.getElementsArray( {tag: 'sbstyle_selected' } );
    var card_id = null;
    if (selected_cards.length > 0) {
        card_id = selected_cards[0];
    }
    return card_id;
}


function checkValidDestination( selected_card_id, card_id ) {
    var orig_zone_id = bga.getElement( {id: selected_card_id}, 'parent' );
    var dest_zone_id = bga.getElement( {id: card_id}, 'parent' );
    
    if (bga.hasTag( dest_zone_id, 'DECK')) {
        // Forbidden
        bga.cancel( _('You cannot send a card to the deck or graveyard!') );
    } else if (bga.hasTag( dest_zone_id, 'GRAVEYARD')) {
      // Forbidden
        bga.cancel( _('You cannot send a card to the graveyard!') );
    } else if (bga.hasTag( dest_zone_id, 'EVOLUTION_LINE')) {
      // Forbidden
        bga.cancel( _('You should select another zone!') );
    } else {
      var energy_pool = this.getActivePlayerEnergyPool();
      var energy_cost = bga.getElement( {id: selected_card_id}, "c_energyCost");
        if (energy_pool < energy_cost) {
      // not enough energy to pay the card    
        bga.cancel( _('You do not have enough energy.') );
        }
    }
}