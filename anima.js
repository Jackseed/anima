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

    this.growth();
    
    var tokenId = bga.getElement( {name: "Phase_token"});
    var energyPhaseZone = bga.getElement( {name: "Energy_phase_zone"});
    var active_energy_pool_id = this.getActivePlayerEnergyPoolId();
    var active_player_energy_production = this.getActivePlayerEnergyProduction();
    
    // réinitialise le token de phase
    bga.moveTo(tokenId, energyPhaseZone);

    // accumule l'énergie créée
    this.setCounterValue(active_energy_pool_id, active_player_energy_production);
    bga.displayScoring(active_energy_pool_id, bga.getActivePlayerColor(), active_player_energy_production);
}

function checkEndOfGame() {
    var isGameEnd = (bga.getElement( {id: this.getActivePlayerEnergyPoolId()}, 'value') >= 25);

    if (!isGameEnd) {
    bga.nextState('done');
    } else {
       // End game
    bga.endGame();
    }
}

function setCounterValue(counter_id, value) {
    var props = [];
    props[counter_id] = {value: value};
    bga.setProperties(props);
}

function getActivePlayerEnergyPoolId() {
    if (bga.getActivePlayerColor() == 'ff0000') return bga.getElement({tag: 'ENERGY_POOL_RED'});
    if (bga.getActivePlayerColor() == '008000') return bga.getElement({tag: 'ENERGY_POOL_GREEN'});
    if (bga.getActivePlayerColor() == '0000ff') return bga.getElement({tag: 'ENERGY_POOL_BLUE'});
    if (bga.getActivePlayerColor() == 'ffa500') return bga.getElement({tag: 'ENERGY_POOL_YELLOW'});
    return null;
}

function getActivePlayerFoodPoolId() {
    if (bga.getActivePlayerColor() == 'ff0000') return bga.getElement( {tag: 'FOOD_POOL_RED'});
    if (bga.getActivePlayerColor() == '008000') return bga.getElement( {tag: 'FOOD_POOL_GREEN'});
    if (bga.getActivePlayerColor() == '0000ff') return bga.getElement( {tag: 'FOOD_POOL_BLUE'});
    if (bga.getActivePlayerColor() == 'ffa500') return bga.getElement( {tag: 'FOOD_POOL_YELLOW'});
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
    var sum_hibernation_value = hibernation();
    function add(a, b) {
    return parseInt(a) + parseInt(b);
    }
    
    sum_food_cost -= sum_hibernation_value;
    this.adaptation();
    return sum_food_cost;
}

function getActivePlayerEnergyProduction() {
    var active_player_board_id = bga.getElement({tag: 'BOARD_' + this.getExplicitActiveColor()});
    var board_energy_productions = bga.getElementsArray({parent: active_player_board_id}, 'c_energyProduction');
    var active_player_energy_production = board_energy_productions.reduce(add, 0);
    function add(a, b) {
    return parseInt(a) + parseInt(b);
    }
    return active_player_energy_production;
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
    var dest_zone_id = bga.getElement({name: 'GRAVEYARD_' + this.getExplicitActiveColor()});
    var active_food_pool_id = this.getActivePlayerFoodPoolId();
    var card_food_production = bga.getElement({id: card_id}, 'c_foodProduction');
    var food_pool = bga.getElement({id: active_food_pool_id}, 'value');
    var props = [];
    var new_food_pool = parseInt(food_pool) + parseInt(card_food_production);
    
    props[active_food_pool_id] = {value: new_food_pool};
    
    bga.moveTo(card_id, dest_zone_id);
    bga.setProperties(props);
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
    
    this.checkAdipose(card_id);

}

function enrollCreature(card_id) {
    var dest_zone_id = bga.getElement({tag: 'BOARD_' + this.getExplicitActiveColor()});
    var active_energy_pool_id = this.getActivePlayerEnergyPoolId();
    var card_energy_cost = bga.getElement({id: card_id}, 'c_energyCost');
    var energy_pool = bga.getElement({id: active_energy_pool_id}, 'value');
    
    if (parseInt(energy_pool) < parseInt(card_energy_cost)) {
        bga.cancel(_('You do not have enough energy for this.'));
    } else {
        // réduit l'énergie pool du coût d'énergie de la carte achetée
        bga.removeStyle(bga.getElements({tag: 'sbstyle_selected'}), 'selected' );
        var props = [];
        var new_energy_pool = parseInt(energy_pool) - parseInt(card_energy_cost);
        props[active_energy_pool_id] = {value: new_energy_pool};
        bga.setProperties(props);
        // déplace la carte sur le board sélectionné
        bga.moveTo(card_id, dest_zone_id);
        bga.pause(1500);
        // pioche une nouvelle
        this.draw();
        // check si la carte jouée a scry 
        if (bga.hasTag(card_id, 'SCRY')) {
            bga.pause(1500);
            this.scry(bga.getElement({id: card_id}, "c_scryValue"));
        }
        // check si la carte jouée est volante
        if (bga.hasTag(card_id, 'FLYING')) {
            this.checkFlying(card_id);
        }
    }
}

function draw() {
    // remplace la carte achetée par la carte du dessus du deck
    var deck_id = bga.getElement({name: 'Deck'});
    var deck_cards = bga.getElementsArray( {parent: deck_id} );
    var card_on_top_id = deck_cards[deck_cards.length - 1];
    var evolution_line_id = bga.getElement({name: 'Evolution_line'});
        // cas où le deck est vide
        if (deck_cards.length === parseInt(0)) {
            bga.log('There is no more card in the deck.');
        } else {
        bga.moveTo(card_on_top_id, evolution_line_id);
        }
}

function expand(parent_id) {
    var parent_zone = bga.getElement( {id: parent_id}, ['id','name'] );
    var cards_ids = bga.getElementsArray( {parent: parent_zone.id} );
    var expand_id = bga.getElement( {name: 'Expand_zone' } );
    var tag_name = bga.getElement({id : expand_id}, 'tags');
    var tag_name_string = tag_name.toString();
    
    // supprime le tag de l'expand pour sa prochaine utilisation
    bga.removeTag(expand_id, tag_name_string);
    // ajoute le nom de la parent zone en tag à l'expand zone pour savoir où la collapse ensuite
    bga.addTag(expand_id, parent_zone.name);
    
    
    var props = [];
    props[expand_id] = {
        x: 350, 
        y: 100, 
        width:700, 
        height:500, 
        visible: 'player'+bga.getActivePlayerColor(), 
        howToArrange: 'spreaded', 
        inlineStyle: 'background-color: rgba(255, 255, 255, 0.8)'
    };
    bga.setProperties( props );
    
    bga.moveTo( cards_ids, expand_id );    
}

function collapse(){
    var expand_id = bga.getElement( {name: 'Expand_zone' } );
    var parent_name = bga.getElement ({id: expand_id}, 'tags');
    var parent_name_string = parent_name.toString();
    var parent_id = bga.getElement({name: parent_name_string});
    var cards_ids = bga.getElementsArray( {parent: expand_id } );

    // remet l'expand à sa place
    var props = [];
    props[expand_id] = {
      x: 234, 
      y: 814, 
      width:340, 
      height:120, 
      visible: 'everyone', 
      howToArrange: 'stacked',
      inlineStyle: 'background-color: transparent'
    };
    bga.setProperties( props );
    bga.moveTo( cards_ids, parent_id );
    
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
    bga.moveTo(token_id, buying_phase_zone_id);
    bga.log("You are entering Enrolling phase, be wise !");
    break;
    
    case 'Buying_phase_zone':
    bga.moveTo(token_id, killing_phase_zone_id);
    bga.log("Soon, blood will flow and life goes on. ");
    break;
    
    case 'Killing_phase_zone':
    var food_pool = bga.getElement({id: this.getActivePlayerFoodPoolId()}, 'value');
    var sum_food_cost = this.getActivePlayerFoodCost();

    if (food_pool >= sum_food_cost){
       this.setCounterValue(this.getActivePlayerFoodPoolId(),0);
       this.setCounterValue(this.getActivePlayerEnergyPoolId(),0);
       bga.moveTo(token_id, end_of_turn_phase_zone_id);
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
    
    var parent_id = bga.getElement( {id: card_id}, 'parent' );
    var parent_name = bga.getElement( {id: parent_id}, 'name');
    var card_parent = bga.getElement( {id: parent_id}, ['id','name','tags','howToArrange'] );
    var phase_token_id = bga.getElement( {name: 'Phase_token'});
    var phase_token_zone = bga.getElement ( {id: phase_token_id}, 'parent');
    var active_phase_zone_name = bga.getElement ( {id: phase_token_zone}, 'name');
    var explicitActiveColor = this.getExplicitActiveColor();
    var selected_card_id = this.getSelectedCard();
    var deck_id = bga.getElement({tag: 'DECK'});
    var expand_zone_id = bga.getElement({name: 'Expand_zone'});
    
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
        if (active_phase_zone_name === 'Buying_phase_zone') {
            bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
            bga.addStyle( card_id, 'selected' );            
        } else {
            bga.cancel( _('Please wait for the Enrolling phase.'));
        }
    }
    // Cas où la carte est dans le deck
    if (bga.hasTag(parent_id, 'DECK')) {
        if (selected_card_id === null) {
            
            bga.cancel( _("You cannot do that (click on deck)"));
        
        // cas où une carte a été pré-sélectionnée
        // SCRY: vérifie que la carte pré-sélectionnée vient de la zone 'expand'
        } else if (bga.getElement ( {id: selected_card_id}, 'parent') === expand_zone_id) {
            
            // si c'est le cas, remet la carte pré-sélectionnée au dessus du deck
            bga.flip(selected_card_id);                            
            bga.moveTo(selected_card_id, deck_id);
            bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
            
            // vérifie qu'il y a encore des cartes dans la zone expand, sinon la referme
            var expand_cards = bga.getElementsArray({parent: expand_zone_id});
            if (expand_cards.length === 0) {
                this.collapse();
            }
        } else {
            bga.cancel("You cannot put this card on the deck");
        }
    }
    
    // Cas où la carte est au cimetière ou retirée de la partie
    if (bga.hasTag(parent_id, 'GRAVE') || bga.hasTag(parent_id, 'REMOVAL') ) {
        
        // si aucune carte n'a été pré-sélectionnée, montre le cimetière / les cartes retirées de la partie
        if (selected_card_id === null) {
            
            this.expand(parent_id);
            
        } else {
            
            // si une carte a été pré-sélectionnée et qu'il s'agit du cimetière actif
            // la déplace au cimetière si phase 3
            if ((bga.hasTag(parent_id, 'GRAVEYARD_'+explicitActiveColor)) && (active_phase_zone_name === 'Killing_phase_zone')) {
              
              this.killCreature(selected_card_id);
            
                
            } else {
            // ne peut pas être fait sinon
              bga.cancel( _('You cannot play this card here.') );
            }
        }
    }
    
    // Cas où la carte sélectionnée se trouve dans la zone Expand
    if ( parent_id === expand_zone_id) {
            this.collapse();
    }
     
    
    
    // cas où la carte est sélectionné à partir de l'expand zone (zone de vision des cartes du deck, type scry)
    if (bga.hasTag(parent_id, 'EXPAND_ZONE')) {
        var selected_card_id_zone = bga.getElement ( {id: selected_card_id}, 'parent');
        if (selected_card_id === null) {
            
            // cas du Scry notamment
            bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
            bga.addStyle( card_id, 'selected' );
            
        // cas de l'adipose (couche graisseuse), vérifie que la carte sélectionnée a cet effet et est au cimetière
        } else if ( (bga.hasTag(selected_card_id, 'ADIPOSE')) && (bga.hasTag(selected_card_id_zone, 'GRAVEYARD_'+ explicitActiveColor)) ) {
            
            this.adipose(selected_card_id, card_id);
            
        } else {
            
            // cas du Scry ou la personne souhaite changer de carte
            bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
            bga.addStyle( card_id, 'selected' );
        }
    }
    
    
}

function onClickZone(zone_id) {
    var selected_card_id = this.getSelectedCard();
    var phase_token_id = bga.getElement( {name: 'Phase_token'});
    var phase_token_zone = bga.getElement ( {id: phase_token_id}, 'parent');
    var active_phase_zone_name = bga.getElement ( {id: phase_token_zone}, 'name');
    var active_board_id = bga.getElement({tag: 'BOARD_'+ this.getExplicitActiveColor() });
    var active_graveyard_id = bga.getElement({name: 'GRAVEYARD_' + this.getExplicitActiveColor()});
    var deck_id = bga.getElement({tag: 'DECK'});
    var expand_zone_id = bga.getElement({tag: 'EXPAND_ZONE'});
    var active_removal_zone_id = bga.getElement({tag: 'REMOVAL_ZONE_' + this.getExplicitActiveColor()});

    if (selected_card_id === null) {
        bga.cancel('Please select a card.');
    } else {
            var selected_card_id_zone = bga.getElement ( {id: selected_card_id}, 'parent');
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
                    // cas où une card de l'evolution line a été sélectionnée au préalable
                    if (bga.hasTag(selected_card_id_zone,"EVOLUTION_LINE")) {
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
                        // 3e cas de la removal zone avec flying
                        } else if (zone_id == active_removal_zone_id) {
                            if (bga.hasTag(selected_card_id, 'sbstyle_CLICKABLE')) {
                                bga.moveTo(selected_card_id, active_removal_zone_id);
                                bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE'}), 'CLICKABLE' );
                                bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
                                this.draw();
                            }
                        // cas où le joueur ne choisit ni un board, ni une removal zone
                        } else {
                            bga.cancel('Please select a board to play this card');
                        }
                    // cas où une carte de la zone de vision du deck a été sélectionnée au préalable
                    } else if (bga.hasTag(selected_card_id_zone,"EXPAND_ZONE")) {
                        //si le deck est clické ensuite, on la retourne et la met au dessus du deck
                        if (zone_id == deck_id) {
                            bga.flip(selected_card_id);                            
                            bga.moveTo(selected_card_id, deck_id);
                            bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
                            // vérifie qu'il y a encore des cartes dans la zone expand, sinon la referme
                            var expand_cards = bga.getElementsArray({parent: expand_zone_id});
                            if (expand_cards.length === 0) {
                                var props = [];
                                props[expand_zone_id] = {
                                  x: 208, 
                                  y: 820, 
                                  width:340, 
                                  height:120, 
                                  visible: 'everyone', 
                                  howToArrange: 'stacked',
                                  inlineStyle: 'background-color: transparent'
                                };
                                bga.setProperties( props );
                            }
                        } else {
                            bga.cancel("Please select the deck.")
                        }
                    // autres cas non encore possible
                    } else {
                        bga.cancel('You cannot do that.')
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


function scry(c_scryValue){
    var cards_on_top_ids = [];
    var deck_id = bga.getElement({name: 'Deck'});
    var deck_cards = bga.getElementsArray( {parent: deck_id} );
    // prévoit le cas où le deck est vide
    if (deck_cards.length === parseInt(0)) {
        bga.log('There is no more card in the deck.');
    // prévoit le cas où il y a moins de cartes au-dessus du deck que de scryValue
    } else if ( deck_cards.length < c_scryValue ) {
            for (var i = 0; i < deck_cards.length; i++) {
            var top_i_card_id = deck_cards[deck_cards.length - 1 - i];
            cards_on_top_ids.push(top_i_card_id);
            }
            var expand_id = bga.getElement( {name: 'Expand_zone'} );
            var props = [];
                        props[expand_id] = {
                            x: 50, 
                            y: 100, 
                            width:700, 
                            height:500, 
                            visible: 'player'+bga.getActivePlayerColor(), 
                            howToArrange: 'spreaded', 
                            inlineStyle: 'background-color: rgba(255, 255, 255, 0.8)'
                        };
            bga.setProperties(props);
            bga.moveTo(cards_on_top_ids, expand_id);
            bga.pause( 1500 );
            for (var j = 0; j < cards_on_top_ids.length; j++) {
                            bga.flip( cards_on_top_ids[j] );
            }
    // cas "normaux"
    } else {
        // sélectionne les X cartes au dessus du deck, X = scryValue
        for (var i = 1; i < parseInt(c_scryValue) + 1; i++) {
        var top_i_card_id = deck_cards[deck_cards.length - i];
        cards_on_top_ids.push(top_i_card_id);
        }
        // sort l'expand zone et déplace les cartes du dessus du deck dessus, face visible
        var expand_id = bga.getElement( {name: 'Expand_zone'} );
        var props = [];
                    props[expand_id] = {
                        x: 50, 
                        y: 100, 
                        width:700, 
                        height:500, 
                        visible: 'player'+bga.getActivePlayerColor(), 
                        howToArrange: 'spreaded', 
                        inlineStyle: 'background-color: rgba(255, 255, 255, 0.8)'
                    };
        bga.setProperties(props);
        bga.moveTo(cards_on_top_ids, expand_id);
        bga.pause( 1500 );
        for (var j = 0; j < cards_on_top_ids.length; j++) {
                        bga.flip( cards_on_top_ids[j] );
        }
    }
}

function hibernation() {
    var active_board_id = bga.getElement({tag: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});
    var board_hibernation_values = bga.getElementsArray({parent: active_board_id}, 'c_hibernationValue');
    var sum_hibernation_value = board_hibernation_values.reduce(add, 0);
    function add(a, b) {
    return parseInt(a) + parseInt(b);
    }
    if (sum_hibernation_value > 0) {
        for (var i = 0; i < board_cards_ids.length; i++) {
            var props = [];
            // réduit la valeur d'hibernation à 0 une fois son effet utilisé
            props[board_cards_ids[i]] = {c_hibernationValue: 0};
            bga.setProperties(props);
        }
    }
    return sum_hibernation_value;
}

function adaptation() {
    var active_board_id = bga.getElement({tag: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});
    // vérifie qu'il y a une carte avec adaptation et si c'est le cas remplace son foodCost par sa valeur d'adaptation
    board_cards_ids.forEach(function(card_id){
       if (bga.hasTag(card_id, 'ADAPTATION')) {
            i_card_adaptation_value = bga.getElement({id: card_id}, 'c_adaptationValue');
            var props = [];
            props[card_id] = {c_foodCost: i_card_adaptation_value};
            bga.setProperties(props);
        } 
    });
}

function checkAdipose(card_id) {
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    
    if (bga.hasTag(card_id, 'ADIPOSE')) {
    bga.addStyle( card_id, 'selected' );
    this.expand(active_board_id);
    }
    
    return;
}

function adipose(adipose_card_id, targeted_card_id) {
    var adipose_card_value = bga.getElement({id: adipose_card_id}, 'c_adiposeValue');
    var targeted_card_id_food_production = parseInt(bga.getElement({id: targeted_card_id}, 'c_foodProduction'));
    var expand_zone_id = bga.getElement({name: 'Expand_zone'});
    var props = [];
    
    // augmente la food_production de la carte ciblée
    targeted_card_id_food_production += parseInt(adipose_card_value);
    props[targeted_card_id] = {c_foodProduction: targeted_card_id_food_production};
    bga.setProperties( props );
    
    // supprime la sélection de la carte adipose
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
    
    bga.displayScoring(card_id, bga.getActivePlayerColor(), selected_card_adipose_value);
    
    // renvoie les cartes sur le board
    bga.moveTo(bga.getElementsArray({parent: expand_zone_id}), bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() }));
    
    // range l'expand zone
    this.collapse();
}

function growth() {
    var active_board_id = bga.getElement({tag: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});

    for (var i = 0; i < board_cards_ids.length; i++) {
        // vérifie qu'une carte a growth
        if (bga.hasTag(board_cards_ids[i], 'GROWTH')) {
            // si oui, augmente ses stats
            i_card_growth_value = bga.getElement({id: board_cards_ids[i]}, 'c_growthValue');
            i_card_food_production = parseInt(bga.getElement({id: board_cards_ids[i]}, 'c_foodProduction'));
            i_card_food_production += parseInt(i_card_growth_value);
            i_card_energy_production = parseInt(bga.getElement({id: board_cards_ids[i]}, 'c_energyProduction'));
            i_card_energy_production += parseInt(i_card_growth_value);
            var props = [];
            props[board_cards_ids[i]] = {
                c_foodProduction: i_card_food_production,
                c_energyProduction: i_card_energy_production
            };
            bga.setProperties(props);
        }
    }
}


function checkFlying(card_id) {
    var active_board_id = bga.getElement({tag: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});
    var deck_id = bga.getElement({tag: 'EVOLUTION_LINE'});
    var deck_cards_ids = bga.getElementsArray({parent: deck_id});
    var flying_counter = 0;
    
    for (var i = 0; (i < board_cards_ids.length) && (flying_counter < 2); i++) {
        if (bga.hasTag(board_cards_ids[i], 'FLYING')) {
            if (flying_counter > 0) {
                bga.log('FLYING EFFECT: you can remove a card from the Evolution line');
                bga.addStyle( card_id, 'REDSELECTED' );
                bga.addStyle( deck_cards_ids, 'clickable' );
                flying_counter++;
                return true;
            } else {
                flying_counter++;
            }
        }
    }
    return false;
}


