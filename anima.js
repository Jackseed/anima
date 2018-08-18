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
  
    bga.moveTo(tokenId, energyPhaseZone);
    
    var active_player_board_id = bga.getElement({tag: 'BOARD_' + this.getExplicitActiveColor()});
    var active_energy_pool_id = null;
    if (bga.getActivePlayerColor() == 'ff0000') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_RED'});
    if (bga.getActivePlayerColor() == '008000') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_GREEN'});
    if (bga.getActivePlayerColor() == '0000ff') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_BLUE'});
    if (bga.getActivePlayerColor() == 'ffa500') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_YELLOW'});
    
    var board_energy_productions = bga.getElementsArray({parent: active_player_board_id}, 'c_energyProduction');
    var sum_energy_production = board_energy_productions.reduce(add, 0);
    function add(a, b) {
    return parseInt(a) + parseInt(b);
    }
    var props = [];
    props[active_energy_pool_id] = {value: sum_energy_production};
    bga.displayScoring(active_energy_pool_id, bga.getActivePlayerColor(), sum_energy_production);
    bga.pause(1000);
    bga.setProperties(props);
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

function getActivePlayerEnergyPool() {
    if (bga.getActivePlayerColor() == 'ff0000') return bga.getElement( {tag: 'ENERGY_POOL_RED'}, 'value');
    if (bga.getActivePlayerColor() == '008000') return bga.getElement( {tag: 'ENERGY_POOL_GREEN'}, 'value');
    if (bga.getActivePlayerColor() == '0000ff') return bga.getElement( {tag: 'ENERGY_POOL_BLUE'}, 'value');
    if (bga.getActivePlayerColor() == 'ffa500') return bga.getElement( {tag: 'ENERGY_POOL_YELLOW'},'value');
    return null;
}

function getActivePlayerFoodPool() {
    if (bga.getActivePlayerColor() == 'ff0000') return bga.getElement( {tag: 'FOOD_POOL_RED'}, 'value');
    if (bga.getActivePlayerColor() == '008000') return bga.getElement( {tag: 'FOOD_POOL_GREEN'}, 'value');
    if (bga.getActivePlayerColor() == '0000ff') return bga.getElement( {tag: 'FOOD_POOL_BLUE'}, 'value');
    if (bga.getActivePlayerColor() == 'ffa500') return bga.getElement( {tag: 'FOOD_POOL_YELLOW'},'value');
    return null;
}

function getExplicitActiveColor() {
    if (bga.getActivePlayerColor() == 'ff0000') return 'RED';
    if (bga.getActivePlayerColor() == '008000') return 'GREEN';
    if (bga.getActivePlayerColor() == '0000ff') return 'BLUE';
    if (bga.getActivePlayerColor() == 'ffa500') return 'YELLOW';
    return null;
}

function getActivePlayerFoodCost() {
    var active_board_id = bga.getElement({tag: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_food_costs = bga.getElementsArray({parent: active_board_id}, 'c_foodCost');
    var sum_food_cost = board_food_costs.reduce(add, 0);

    function add(a, b) {
    return parseInt(a) + parseInt(b);
    }
    return sum_food_cost;
}

function getSelectedCard() {
    var selected_cards = bga.getElementsArray( {tag: 'sbstyle_selected' } );
    var card_id = null;
    if (selected_cards.length > 0) {
        card_id = selected_cards[0];
    }
    return card_id;
}

function killCreature(card_id) {
    var dest_zone_id = bga.getElement({tag: 'GRAVEYARD_' + this.getExplicitActiveColor()});
    var active_food_pool_id = null;
    if (bga.getActivePlayerColor() == 'ff0000') active_food_pool_id = bga.getElement({tag: 'FOOD_POOL_RED'});
    if (bga.getActivePlayerColor() == '008000') active_food_pool_id = bga.getElement({tag: 'FOOD_POOL_GREEN'});
    if (bga.getActivePlayerColor() == '0000ff') active_food_pool_id = bga.getElement({tag: 'FOOD_POOL_BLUE'});
    if (bga.getActivePlayerColor() == 'ffa500') active_food_pool_id = bga.getElement({tag: 'FOOD_POOL_YELLOW'});
    var card_food_production = bga.getElement({id: card_id}, 'c_foodProduction');
    var food_pool = getActivePlayerFoodPool();
    var props = [];
    var new_food_pool = parseInt(food_pool) + parseInt(card_food_production);
    props[active_food_pool_id] = {value: new_food_pool};
    
    bga.moveTo(card_id, dest_zone_id);
    bga.displayScoring(active_food_pool_id, bga.getActivePlayerColor(), card_food_production);
    bga.pause(1000);
    bga.setProperties(props);
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
}

function enrollCreature(card_id) {
    var dest_zone_id = bga.getElement({tag: 'BOARD_' + this.getExplicitActiveColor()});
    var active_energy_pool_id = null;
    if (bga.getActivePlayerColor() == 'ff0000') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_RED'});
    if (bga.getActivePlayerColor() == '008000') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_GREEN'});
    if (bga.getActivePlayerColor() == '0000ff') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_BLUE'});
    if (bga.getActivePlayerColor() == 'ffa500') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_YELLOW'});
    var card_energy_cost = bga.getElement({id: card_id}, 'c_energyCost');
    var energy_pool = getActivePlayerEnergyPool();
    
    if (parseInt(energy_pool) < parseInt(card_energy_cost)) {
        bga.cancel(_('You do not have enough energy for this.'));
    } else {
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
    var props = [];
    var new_energy_pool = parseInt(energy_pool) - parseInt(card_energy_cost);
    props[active_energy_pool_id] = {value: new_energy_pool};
    bga.setProperties(props);
    bga.moveTo(card_id, dest_zone_id);
    bga.pause(1500);
    
    var deck_id = bga.getElement({name: 'Deck'});
    var deck_cards = bga.getElementsArray( {parent: deck_id} );
    var card_on_top_id = deck_cards[deck_cards.length - 1];
    var evolution_line_id = bga.getElement({name: 'Evolution_line'});
    
        if (deck_cards.length === parseInt(0)) {
            bga.log('There is no more card in the deck.');
        } else {
        bga.moveTo(card_on_top_id, evolution_line_id);
        }
    }
}

function onPhaseTokenClick(token_id) {
    var zone_parent_id = bga.getElement( {id: token_id}, 'parent');
    var zone_parent_name = bga.getElement({id: zone_parent_id}, 'name');
    var buying_phase_zone_id = bga.getElement({name: 'Buying_phase_zone'});
    var killing_phase_zone_id = bga.getElement({name: 'Killing_phase_zone'});
    var feeding_phase_zone_id = bga.getElement({name: 'Feeding_phase_zone'});
    var end_of_turn_phase_zone_id = bga.getElement({name: 'End_of_turn_phase_zone'});
  
    bga.checkAction('selectToken');

  switch (zone_parent_name) {
    case 'Energy_phase_zone':
    this.checkEndOfGame();
    bga.moveTo(token_id, buying_phase_zone_id);
    bga.log("You are entering Enrolling phase, be wise !");
    break;
    
    case 'Buying_phase_zone':
    bga.moveTo(token_id, killing_phase_zone_id);
    bga.log("Soon, blood will flow and life goes on. ");
    break;
    
    case 'Killing_phase_zone':
    var food_pool = this.getActivePlayerFoodPool();
    var sum_food_cost = this.getActivePlayerFoodCost();
    
    if (food_pool > sum_food_cost){
        bga.moveTo(token_id, end_of_turn_phase_zone_id);
        
        var active_food_pool_id = null;
        if (bga.getActivePlayerColor() == 'ff0000') active_food_pool_id = bga.getElement({tag: 'FOOD_POOL_RED'});
        if (bga.getActivePlayerColor() == '008000') active_food_pool_id = bga.getElement({tag: 'FOOD_POOL_GREEN'});
        if (bga.getActivePlayerColor() == '0000ff') active_food_pool_id = bga.getElement({tag: 'FOOD_POOL_BLUE'});
        if (bga.getActivePlayerColor() == 'ffa500') active_food_pool_id = bga.getElement({tag: 'FOOD_POOL_YELLOW'});
        var active_energy_pool_id = null;
        if (bga.getActivePlayerColor() == 'ff0000') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_RED'});
        if (bga.getActivePlayerColor() == '008000') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_GREEN'});
        if (bga.getActivePlayerColor() == '0000ff') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_BLUE'});
        if (bga.getActivePlayerColor() == 'ffa500') active_energy_pool_id = bga.getElement({tag: 'ENERGY_POOL_YELLOW'});
        var props = [];
        props[active_food_pool_id] = {value: 0};
        props[active_energy_pool_id] = {value: 0};
        bga.setProperties(props);
    
        bga.nextPlayer();
        bga.nextState('done');
    } else {
        bga.cancel( _('You do not have enough food to feed all your creatures.'))
    }
    break;
    
    case 'Feeding_phase_zone':
    bga.log("you're in feeding phase, a not fed animal is a dead animal.");
    break;
    
    case 'End_of_turn_phase_zone':
    bga.log("End of your turn, congratz you made it!");
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
    var explicitActiveColor = this.getExplicitActiveColor();
    var selected_card_id = this.getSelectedCard();
    // l'ordre = esprit, eau,...
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
            case 'Feeding_phase_zone':
                if (bga.hasTag(card_id, 'SPECIAL_EFFECT')) {
                    bga.log("Special effect not yet implemented...");
                    } else {
                    bga.cancel( _("This card has not any effect."));
                    }
                break;
            case 'Buying_phase_zone':
                bga.cancel( _("You should select a card from the Evolution line."));
                break;
            case 'Killing_phase_zone':
              // in any case, should select the card clicked and deselect the one clicked before, if any
              bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
              bga.addStyle( card_id, 'selected' );
              break;
              }
        }
    }
    if (bga.hasTag(parent_id, 'EVOLUTION_LINE')) {
        if (active_phase_zone_name !== 'Buying_phase_zone') {
            bga.cancel( _('Please wait for the Enrolling phase.'));
        } else {
            bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
            bga.addStyle( card_id, 'selected' );      
        }
    }
    if (bga.hasTag(parent_id, 'DECK')) {
            bga.cancel( _("You cannot do that (click on deck)"));
    }
    // Cas où la carte est dans le cimietière (visible ou non)
    if (bga.hasTag(parent_id, 'GRAVE')) {
      // cas où le cimetière n'est pas visible
      if (card_parent.howToArrange === 'stacked') {
        // Cas où aucune carte n'est sélectionnée
        if (selected_card_id === null) {
            // Expand collected cards
            // cards_id = toutes les cartes du cimetière
            var cards_ids = bga.getElementsArray( {parent: card_parent.id} );
            var expand_id = bga.getElement( {tag: 'EXPAND_GRAVEYARD_'+ clickedColor } );

    
            // crée la zone où les cartes du cimetière seront visibles
            if (clickedColor === 'RED') {
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
            }
            // règle le décalage apparu je ne sais pas trop pour quoi quand on clique sur le vert...
            if (clickedColor === 'GREEN') {
                var props = [];
                props[expand_id] = {
                    x: -600, 
                    y: 130, 
                    width:700, 
                    height:500, 
                    visible: 'player'+bga.getActivePlayerColor(), 
                    howToArrange: 'spreaded', 
                    inlineStyle: 'background-color: rgba(255, 255, 255, 0.8)'
                };
            }
            bga.setProperties( props );
          // déplace les cartes du cimetière sur la nouvelle zone
          bga.moveTo( cards_ids, expand_id );

        } else {
            // Cas où une carte a été précédemment sélectionnée
            // la déplace au cimetière si phase 3
            if ((bga.hasTag(parent_id, 'GRAVEYARD_'+explicitActiveColor)) && (active_phase_zone_name === 'Killing_phase_zone')) {
              this.killCreature(selected_card_id);
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

            // Collapse collected cards
            var cards_ids = bga.getElementsArray( {parent: card_parent.id} );
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
    

}

function onClickZone(zone_id) {
    var selected_card_id = this.getSelectedCard();
    var phase_token_id = bga.getElement( {name: 'Phase_token'});
    var phase_token_zone = bga.getElement ( {id: phase_token_id}, 'parent');
    var active_phase_zone_name = bga.getElement ( {id: phase_token_zone}, 'name');
    var active_board_id = bga.getElement({tag: 'BOARD_'+ this.getExplicitActiveColor() });
    var active_graveyard_id = bga.getElement({tag: 'GRAVEYARD_' + this.getExplicitActiveColor()});

    if (selected_card_id === null) {
        bga.cancel('Please select a card.');
    } else {
            switch (active_phase_zone_name) {
                case 'Energy_phase_zone':
                case 'Feeding_phase_zone':
                    if (bga.hasTag(card_id, 'SPECIAL_EFFECT')) {
                        bga.log("Special effect not yet implemented...");
                        } else {
                        bga.cancel( _("You cannot do this right now."));
                        }
                    break;
                case 'Buying_phase_zone':
                    // cas où une card de l'evolution line ou du cimetière a été sélectionnée avant
                    // premier cas où la carte est jouée sur son propre board
                    if (zone_id == active_board_id) {
                        this.enrollCreature(selected_card_id);
                    // deuxième cas du virus joué chez l'autre    
                    } else if ( (zone_id !== active_board_id) && (bga.hasTag(zone_id, 'BOARD')) ) {
                        if ((bga.hasTag(selected_card_id, 'SPECIAL_EFFECT')) && (bga.getElement({id: selected_card_id}, 'c_specialEffect') === 'virus')) {
                            bga.log('enroll creature à coder! (virus)');   
                        } else {
                            bga.cancel( _("This creature is not a virus.")); 
                        }
                    // cas où le joueur ne choisit pas un board pour sa carte sélectionnée
                    } else {
                        bga.cancel( _("Select a board to enroll this creature."));
                    }
                    break;
                case 'Killing_phase_zone':
                    if (zone_id == active_graveyard_id) {
                        this.killCreature(selected_card_id);
                    } else {
                        bga.cancel(_('The creature you want to kill must be sent to your graveyard.'))
                    }
                    break;
            }
    }
}


function scry(scry_value){
    
    var cards_on_top_ids = [];
    var deck_id = bga.getElement({name: 'Deck'});
    var deck_cards = bga.getElementsArray( {parent: deck_id} );
    
    for (var i = 0; i === parseInt(scry_value); i++) {
        var card_on_top_id = deck_cards[parseInt(deck_cards.length) - parseInt(i)];
        cards_ids.push(cards_on_top_id);
    }
        
    var expand_id = bga.getElement( {name: 'EXPAND_ZONE'} );
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
    bga.setProperties(props);
    
    if (deck_cards.length === parseInt(0)) {
        bga.log('There is no more card in the deck.');
    } else {
        bga.moveTo(cards_on_top_ids, expand_id);
    }
    
    return;
}




