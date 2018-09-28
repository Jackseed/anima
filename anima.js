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
    if (this.isThereGrowth()){
        this.activateGrowth();
    }

    if (this.isThereAdaptation()){
        this.activateAdaptation();
    }    
    
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
    var is_game_end = (bga.getElement( {id: this.getActivePlayerEnergyPoolId()}, 'value') >= 25);

    if (!is_game_end) {
    bga.nextState('done');
    } else {
       // End game
    bga.endGame();
    }
}

function endOfTurn(){
    var token_id = bga.getElement( {name: "Phase_token"});
    var end_of_turn_phase_zone_id = bga.getElement({name: 'End_of_turn_phase_zone'});

    if(this.isThereTemporaryModification()){
        this.setOriginalPropertyValue();
    }    
    
    this.setCounterValue(this.getActivePlayerFoodPoolId(),0);
    this.setCounterValue(this.getActivePlayerEnergyPoolId(),0);
    bga.moveTo(token_id, end_of_turn_phase_zone_id);
    bga.nextPlayer();
    bga.nextState('done');
}

function setCounterValue(counter_id, value) {
    var props = [];
    props[counter_id] = {value: value};
    bga.setProperties(props);
}

function setOriginalPropertyValue(card_id) {
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});

    board_cards_ids.forEach(function(card){
        if (bga.hasTag(card, 'FOOD_COST')) {
            var original_food_cost = parseInt(bga.getElement({id: card}, "c_originalFoodCost"));
            this.modifyFoodCost(card, original_food_cost);
        }
    });
}

function isThereTemporaryModification() {
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});
    var is_there_temporary_modification = false;

    board_cards_ids.forEach(function(card){
        if (bga.hasTag(card, 'TEMPORARY_MODIFIED')) {
            is_there_temporary_modification = true;
        }
    });
    return is_there_temporary_modification;
}

// is_temporary is an optional boolean value 
function modifyFoodCost(card_id, value, is_temporary){
    var props = [];
    var original_food_cost = parseInt(bga.getElement({id: card_id}, "c_foodCost"));
    props[card_id] = {c_foodCost: value, c_originalFoodCost: original_food_cost};
    bga.setProperties(props);

    if (is_temporary) {
        bga.addTag(card_id, 'TEMPORARY_MODIFIED');
        bga.addTag(card_id, 'FOOD_COST');
    }
}

function modifyFoodProduction(card_id, value){
    var props = [];
    props[card_id] = {c_foodProduction: value};
    bga.setProperties(props);
}

function modifyEnergyProduction(card_id, value){
    var props = [];
    props[card_id] = {c_energyProduction: value};
    bga.setProperties(props);
}



function getActivePlayerEnergyPoolId() {
    if (bga.getActivePlayerColor() == 'ff0000') return bga.getElement({name: 'ENERGY_POOL_RED'});
    if (bga.getActivePlayerColor() == '008000') return bga.getElement({name: 'ENERGY_POOL_GREEN'});
    if (bga.getActivePlayerColor() == '0000ff') return bga.getElement({name: 'ENERGY_POOL_BLUE'});
    if (bga.getActivePlayerColor() == 'ffa500') return bga.getElement({name: 'ENERGY_POOL_YELLOW'});
    return null;
}

function getActivePlayerFoodPoolId() {
    if (bga.getActivePlayerColor() == 'ff0000') return bga.getElement( {name: 'FOOD_POOL_RED'});
    if (bga.getActivePlayerColor() == '008000') return bga.getElement( {name: 'FOOD_POOL_GREEN'});
    if (bga.getActivePlayerColor() == '0000ff') return bga.getElement( {name: 'FOOD_POOL_BLUE'});
    if (bga.getActivePlayerColor() == 'ffa500') return bga.getElement( {name: 'FOOD_POOL_YELLOW'});
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
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_food_costs = bga.getElementsArray({parent: active_board_id}, 'c_foodCost');
    var sum_food_cost = board_food_costs.reduce(this.add, 0);    

    if (this.isThereHibernation()){
    var sum_hibernation_value = activateHibernation();
    sum_food_cost -= sum_hibernation_value;    
    }     

    return sum_food_cost;
}

function add(a,b){
    return parseInt(a) + parseInt(b);
}

function getActivePlayerEnergyProduction() {
    var active_board_id = bga.getElement({name: 'BOARD_' + this.getExplicitActiveColor()});
    var board_energy_productions = bga.getElementsArray({parent: active_board_id}, 'c_energyProduction');
    var active_player_energy_production = board_energy_productions.reduce(this.add, 0);
    
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

function getClickableRoundedCard() {
    var clickable_rounded_cards = bga.getElementsArray( {tag: 'sbstyle_CLICKABLE_ROUNDED' } );
    var card_id = null;
    if (clickable_rounded_cards.length > 0) {
        card_id = clickable_rounded_cards[0];
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
    
    if (this.hasAdipose(card_id)){
        this.activateAdipose(card_id);
    }
}

function removeCreature(selected_card_id){
    var active_removal_zone_id = bga.getElement({name: 'REMOVAL_' + this.getExplicitActiveColor()});

    bga.moveTo(selected_card_id, active_removal_zone_id);
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE'}), 'CLICKABLE' );
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE_ROUNDED'}), 'CLICKABLE_ROUNDED' );
}

function enrollCreature(card_id) {

    var dest_zone_id = bga.getElement({name: 'BOARD_' + this.getExplicitActiveColor()});
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
        // pioche une nouvelle
        this.draw();
        
        // check si la carte jouée a scry
        if (this.hasScry(card_id)) {            
            this.activateScry(card_id);      
        }       

        if (this.hasFlying(card_id)) {            
            if(this.isThereOtherFlying()){
                this.activateFlying(card_id);
            }      
        } 
    }
}

function draw() {
    // remplace la carte achetée par la carte du dessus du deck
    var deck_id = bga.getElement({name: 'DECK'});
    var deck_cards = bga.getElementsArray( {parent: deck_id} );
    var card_on_top_id = deck_cards[deck_cards.length - 1];
    var evolution_line_id = bga.getElement({name: 'EVOLUTION_LINE'});
        // cas où le deck est vide
        if (deck_cards.length === parseInt(0)) {
            bga.log('There is no more card in the deck.');
        } else {
        bga.moveTo(card_on_top_id, evolution_line_id);
        }
}

// cards_ids is optional, will take the cards into the zone to expand if not defined
function expand(zone_id_to_expand, cards_ids) {
    var parent_zone = bga.getElement( {id: zone_id_to_expand}, ['id','name'] );
    var expand_id = bga.getElement( {name: 'Expand_zone' } );
    var tag_name = bga.getElement({id : expand_id}, 'tags');
    var tag_name_string = tag_name.toString();
    var expand_zone_how_to_arrange_parameter = bga.getElement({id: expand_id}, 'howToArrange');
    
    // vérifie que l'expand n'est pas déjà ouverte
    if (expand_zone_how_to_arrange_parameter === 'spreaded') {
        bga.cancel(_('You already have a zone visible'));
    }

    if (cards_ids === undefined ) {
        cards_ids = bga.getElementsArray( {parent: parent_zone.id} );
    }
    
    // supprime le tag de l'expand pour sa prochaine utilisation
    bga.removeTag(expand_id, tag_name_string);
    // ajoute le nom de la parent zone en tag à l'expand zone pour savoir où la collapse ensuite
    bga.addTag(expand_id, parent_zone.name);
    
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
    bga.moveTo(token_id, feeding_phase_zone_id);
    bga.log("you're in feeding phase, a not fed animal is a dead animal.");
    break;
    
    case 'Feeding_phase_zone':
    var food_pool = bga.getElement({id: this.getActivePlayerFoodPoolId()}, 'value');
    var sum_food_cost = this.getActivePlayerFoodCost();

    if (food_pool >= sum_food_cost){
        bga.trace(sum_food_cost);
        this.endOfTurn();
    } else {
        bga.trace(sum_food_cost);
        bga.log('You do not have enough food to feed all your creatures.');
        bga.moveTo(token_id, killing_phase_zone_id);
    }
    
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
    var clickable_rounded_card = this.getClickableRoundedCard();
    var deck_id = bga.getElement({name: 'DECK'});
    var expand_zone_id = bga.getElement({name: 'Expand_zone'});
    var evolution_line_id = bga.getElement({name: 'EVOLUTION_LINE'});
    var active_graveyard_id = bga.getElement({name: 'GRAVEYARD_'+explicitActiveColor});
    var active_removal = bga.getElement({name: 'REMOVAL_' + this.getExplicitActiveColor()});
    
    // Check play action
    bga.checkAction('selectCard');
    
    // check if the card clicked is on a board
    if (bga.hasTag(parent_id, 'BOARD')) {
        if (parent_name != 'BOARD_'+ explicitActiveColor ) {
            bga.cancel( _('You have to chose a card you control') );      
        } else {
            switch (active_phase_zone_name) {
                case 'Energy_phase_zone':
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
                    // si adipose est en cours, applique l'effet                         
                    if (this.hasAdipose(clickable_rounded_card)) {
                        this.transferAdipose(clickable_rounded_card, card_id);
                    } else {               
                // in any other case, should select the card clicked and deselect the one clicked before, if any
                        bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
                        bga.addStyle( card_id, 'selected' );
                    }
                break;

                case 'Feeding_phase_zone':
                    if (clickable_rounded_card === null){
                        if (this.hasScavenger(card_id)) {
                            this.activateScavenger(card_id);
                        } else if (this.hasCrane(card_id)) {
                            this.activateCrane(card_id);
                        } else {
                            bga.cancel( _("This card has not any effect."));
                        }
                    } else {
                        if (this.hasScavenger(clickable_rounded_card)) {
                            this.desactivateScavenger(clickable_rounded_card);
                        } else if (this.hasCrane(card_id)) {
                            this.desactivateCrane(clickable_rounded_card);
                        } else if (this.hasCrane(clickable_rounded_card)) {
                            this.craneThisCreature(card_id, clickable_rounded_card);
                        } else {
                            bga.cancel( _("What the fuck ?"));
                        }
                    }
                break;
            }
        }
    }
    if (parent_id === evolution_line_id) {
        if (active_phase_zone_name === 'Buying_phase_zone') {
            bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
            bga.addStyle( card_id, 'selected' );            
        } else {
            bga.cancel( _('Please wait for the Enrolling phase.'));
        }
    }
    // Cas où la carte est dans le deck
    if ( parent_id === deck_id) {
        if (selected_card_id === null) {
            
            bga.cancel( _("You cannot do that (click on deck)"));
        
        // cas où une carte a été pré-sélectionnée depuis la zone expand
        } else if (bga.getElement ( {id: selected_card_id}, 'parent') === expand_zone_id) {
            // vérifie qu'un scry est en cours
            if (this.hasScry(clickable_rounded_card)) {
                // si c'est le cas, remet la carte pré-sélectionnée au dessus du deck
                this.scrySelectedCard(selected_card_id);
            } else {
                bga.cancel("You cannot put this card on the deck");
            }
        }
    }
    
    // Cas où la carte est au cimetière ou retirée de la partie
    if ( (bga.hasTag(parent_id,'GRAVE')) || (bga.hasTag(parent_id,'REMOVAL')) ) {
        // si aucune carte n'a été pré-sélectionnée, montre le cimetière / les cartes retirées de la partie
        if ((clickable_rounded_card != null) && (parent_id === active_removal)){
            if(this.hasScavenger(clickable_rounded_card)) {
                this.scavengeSelectedCards(clickable_rounded_card, selected_cards);
            }
        }
        if (selected_card_id === null) {
            this.expand(parent_id);
        } else {
            // si une carte a été pré-sélectionnée et qu'il s'agit du cimetière actif
            // la déplace au cimetière si phase 3
            if ((parent_id === active_graveyard_id) && (active_phase_zone_name === 'Killing_phase_zone')) {
              this.killCreature(selected_card_id);                
            } else {
            // ne peut pas être fait sinon
              bga.cancel( _('You cannot play this card here.') );
            }
        }
    }
    
    // cas où la carte est sélectionné à partir de l'expand zone
    if (parent_id === expand_zone_id) {
        // liste des zones qui nécessitent un collapse si les cartes présentent dans l'expand viennent de cette zone
        var zones_to_collapse = ["GRAVEYARD_RED", "GRAVEYARD_GREEN", "REMOVAL_RED", "REMOVAL_GREEN"];
        var expand_zone_parent = bga.getElement ( {id: expand_zone_id}, 'tags');
        var expand_zone_parent_string = expand_zone_parent.toString();

        if (clickable_rounded_card === null) {
        // vérifie si le parent des cartes dans l'expand fait partie de la liste à collapse
            for (var i = 0; i < zones_to_collapse.length; i ++) {
                if (zones_to_collapse[i] === expand_zone_parent_string) {
                    this.collapse();
                }    
            }
        } else
            // si SCRY en cours, permet de sélectionner une carte 
            if (this.hasScry(clickable_rounded_card)) {
                bga.removeStyle(bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
                bga.addStyle(card_id, 'selected');
            }
            // si SCAVENGER en cours, permet de sélectionner plusieurs cartes
            if (this.hasScavenger(clickable_rounded_card)) {
                if (bga.hasTag(card_id, 'sbstyle_selected')){
                    bga.removeStyle(card_id, 'selected'); 
                } else {                                   
                    bga.addStyle( card_id, 'selected');
                }
            }

    }
}

function onClickZone(zone_id) {
    var selected_card_id = this.getSelectedCard();
    var phase_token_id = bga.getElement( {name: 'Phase_token'});
    var phase_token_zone = bga.getElement ( {id: phase_token_id}, 'parent');
    var active_phase_zone_name = bga.getElement ( {id: phase_token_zone}, 'name');
    var active_board_id = bga.getElement({name:'BOARD_'+ this.getExplicitActiveColor()});
    var active_graveyard_id = bga.getElement({name: 'GRAVEYARD_' + this.getExplicitActiveColor()});
    var deck_id = bga.getElement({name: 'DECK'});
    var expand_zone_id = bga.getElement({name: 'EXPAND_ZONE'});
    var active_removal_zone_id = bga.getElement({name: 'REMOVAL_' + this.getExplicitActiveColor()});
    var clickable_rounded_card = this.getClickableRoundedCard();
    var evolution_line = bga.getElement({name: 'EVOLUTION_LINE'});

    if (selected_card_id === null) {
        bga.cancel('Please select a card.');
    } else {
        var selected_cards = bga.getElementsArray( {tag: 'sbstyle_selected'} );
        var selected_card_id_zone = bga.getElement ( {id: selected_card_id}, 'parent');
        switch (active_phase_zone_name) {
            case 'Energy_phase_zone':
                if (bga.hasTag(card_id, 'SPECIAL_EFFECT')) {
                    bga.log("Special effect not yet implemented...");
                    } else {
                    bga.cancel( _("You cannot do this right now."));
                    }
            break;
            
            case 'Buying_phase_zone':
                // cas où une card de l'evolution line a été sélectionnée au préalable
                if (selected_card_id_zone === evolution_line) {
                    // premier cas où la carte est jouée sur son propre board
                    if (zone_id == active_board_id) {
                        this.enrollCreature(selected_card_id);
                    // deuxième cas du virus joué chez l'autre    
                    } else if ( bga.hasTag(zone_id, 'BOARD') ) {
                        if ((bga.hasTag(selected_card_id, 'SPECIAL_EFFECT')) && (bga.getElement({id: selected_card_id}, 'c_specialEffect') == 'virus')) {
                            bga.log('enroll creature à coder! (virus)');   
                        } else {
                            bga.cancel( _("This creature is not a virus.")); 
                        }
                    // 3e cas de la removal zone avec flying
                    } else if (zone_id == active_removal_zone_id) {
                        if (clickable_rounded_card != null) {
                            if (this.hasFlying(clickable_rounded_card)) { 
                                this.removeCreature(selected_card_id);
                                this.draw();
                            }
                        }
                    // cas où le joueur ne choisit ni un board, ni une removal zone
                    } else {
                        bga.cancel('Please select a board to play this card');
                    }
                // cas où une carte de la zone de vision du deck a été sélectionnée au préalable SCRY
                } else if (bga.hasTag(selected_card_id_zone,"EXPAND_ZONE")) {
                    //si le deck est clické ensuite, on la retourne et la met au dessus du deck
                    if (zone_id == deck_id) {
                        if (clickable_rounded_card != null) {
                            if (this.hasScry(clickable_rounded_card)) { 
                                this.scrySelectedCard(selected_card_id);                        
                            }
                        }
                    } else {
                        bga.cancel("Please select the deck.");
                    }
                // autres cas non encore possible
                } else {
                    bga.cancel('You cannot do that.');
                }
            break;
            
            case 'Killing_phase_zone':
                if (zone_id == active_graveyard_id) {
                    this.killCreature(selected_card_id);
                } else {
                    bga.cancel(_('The creature you want to kill must be sent to your graveyard.'));
                }
            break;
            
            case 'Feeding_phase_zone':
                if (zone_id == active_removal_zone_id) {
                    if (clickable_rounded_card != null) {
                        if(this.hasScavenger(clickable_rounded_card)) {
                            this.scavengeSelectedCards(clickable_rounded_card, selected_cards);
                        }
                    }
                } else {
                    bga.cancel('You cannot do that.');
                }
            break;
        }
    }
}

function hasScry(card_id){
    if (bga.hasTag(card_id, 'SCRY')) {
        return true; 
    }
}
    
function activateScry(card_id){
    var scry_value = bga.getElement({id: card_id}, "c_scryValue");
    var cards_on_top_ids = [];
    var deck_id = bga.getElement({name: 'DECK'});
    var deck_cards = bga.getElementsArray( {parent: deck_id} );

    bga.addStyle(card_id, 'CLICKABLE_ROUNDED' );
    // prévoit le cas où le deck est vide
    if (deck_cards.length === parseInt(0)) {
        bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE_ROUNDED'}), 'CLICKABLE_ROUNDED' );
        bga.log('Cannot scry, no more card in the deck.');
    } else {    
    //show top deck cards in the expand zone
        var cards_to_show = Math.min(deck_cards.length, scry_value);
        
        for (var i = 0; i < cards_to_show; i++) {
            var top_i_card_id = deck_cards[deck_cards.length - i - 1];
            cards_on_top_ids.push(top_i_card_id);
        }

        this.expand(deck_id, cards_on_top_ids);
        
        for (var j = 0; j < cards_on_top_ids.length; j++) {
            bga.flip( cards_on_top_ids[j] );
        }
    }
}

function scrySelectedCard(selected_card_id){
    var expand_zone_id = bga.getElement({name: 'Expand_zone'});
    var deck_id = bga.getElement({name: 'DECK'});
    
    bga.flip(selected_card_id);                            
    bga.moveTo(selected_card_id, deck_id);
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );    
    // vérifie qu'il y a encore des cartes dans la zone expand, sinon la referme

    var expand_cards = bga.getElementsArray({parent: expand_zone_id});
    if (expand_cards.length === parseInt(0)) {
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE_ROUNDED'}), 'CLICKABLE_ROUNDED' );
    this.collapse();
    }
}

function isThereHibernation(){
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});
    var is_hibernation = false;

    board_cards_ids.forEach(function(card_id){
        if (bga.hasTag(card_id, 'HIBERNATION')) {
            is_hibernation = true;
        }
    });
    return is_hibernation;
    
}

function activateHibernation() {
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});
    var board_hibernation_values = bga.getElementsArray({parent: active_board_id}, 'c_hibernationValue');
    var sum_hibernation_value = board_hibernation_values.reduce(this.add, 0);

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

function isThereAdaptation() {
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});
    var isThereAdaptation = false;
    board_cards_ids.forEach(function(card_id){
        if (bga.hasTag(card_id, 'ADAPTATION') && (!bga.hasTag(card_id, 'ADAPTATION_ALREADY_ACTIVATED'))) {
            isThereAdaptation = true;
        }
    });
    return isThereAdaptation;
}

function activateAdaptation() {
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});
    board_cards_ids.forEach(function(card_id){
        if (bga.hasTag(card_id, 'ADAPTATION') && (!bga.hasTag(card_id, 'ADAPTATION_ALREADY_ACTIVATED'))) {
            // adaptation: remplace le foodCost d'une carte par sa valeur d'adaptation
            var adaptation_value = bga.getElement({id: card_id}, 'c_adaptationValue');
            this.modifyFoodCost(card_id, adaptation_value);
            bga.addTag(card_id, 'ADAPTATION_ALREADY_ACTIVATED'); 
        }
    });
}

function hasAdipose(card_id) {
    if (bga.hasTag(card_id, 'ADIPOSE')) {
        return true;
    }
}

function activateAdipose(adipose_card_id){
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var active_board_cards_ids = bga.getElementsArray({parent: active_board_id});

    bga.log('ADIPOSE EFFECT: you can add a +2n counter on a creature you control');
    bga.addStyle(adipose_card_id, 'CLICKABLE_ROUNDED' );
    bga.addStyle(active_board_cards_ids, 'clickable');
}

function transferAdipose(adipose_card_id, targeted_card_id) {
    var adipose_card_value = bga.getElement({id: adipose_card_id}, 'c_adiposeValue');
    var targeted_card_id_food_production = parseInt(bga.getElement({id: targeted_card_id}, 'c_foodProduction'));
    
    // augmente la food_production de la carte ciblée
    targeted_card_id_food_production += parseInt(adipose_card_value);
    this.modifyFoodProduction(targeted_card_id, targeted_card_id_food_production);
    
    bga.displayScoring(targeted_card_id, bga.getActivePlayerColor(), adipose_card_value);
    
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE_ROUNDED'}), 'CLICKABLE_ROUNDED' );
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE'}), 'CLICKABLE' );
}

function isThereGrowth(){
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});
    var is_there_growth = false;
    
    for (var i = 0; i < board_cards_ids.length; i++) {
        if (bga.hasTag(board_cards_ids[i], 'GROWTH')) {
            is_there_growth = true;
            i = board_cards_ids.length;
        }
    }
    return is_there_growth;
}

function activateGrowth() {
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});

    for (var i = 0; i < board_cards_ids.length; i++) {
        if (bga.hasTag(board_cards_ids[i], 'GROWTH')) {
            var growth_value = parseInt(bga.getElement({id: board_cards_ids[i]}, 'c_growthValue'));
            var new_food_production = parseInt(bga.getElement({id: board_cards_ids[i]}, 'c_foodProduction')) + growth_value;
            var new_energy_production = parseInt(bga.getElement({id: board_cards_ids[i]}, 'c_energyProduction')) + growth_value;

            this.modifyFoodProduction(board_cards_ids[i], new_food_production);
            this.modifyEnergyProduction(board_cards_ids[i], new_energy_production);
        }
    }
}

function hasFlying(card_id){
    if (bga.hasTag(card_id, 'FLYING')) {
            return true;
    }
}

function isThereOtherFlying() {
    var active_board_id = bga.getElement({name: 'BOARD_'+ this.getExplicitActiveColor() });
    var board_cards_ids = bga.getElementsArray({parent: active_board_id});
    var flying_counter = 0;
    var is_there_other_flying = false;
    
    for (var i = 0; (i < board_cards_ids.length) && (!is_there_other_flying); i++) {
        if (bga.hasTag(board_cards_ids[i], 'FLYING')) {
            if (flying_counter > 0) {
                is_there_other_flying = true;
            } else {
                flying_counter++;
            }
        }
    }
    return is_there_other_flying;
}

function activateFlying(card_id){
    var evolution_line_id = bga.getElement({name: 'EVOLUTION_LINE'});
    var evolution_line_cards_ids = bga.getElementsArray({parent: evolution_line_id});

    bga.log('FLYING EFFECT: you can remove a card from the Evolution line');
    bga.addStyle( card_id, 'CLICKABLE_ROUNDED' );
    bga.addStyle( evolution_line_cards_ids, 'CLICKABLE' );
}



function hasScavenger(card_id){
    if (bga.hasTag(card_id, 'SCAVENGER')) {
            return true;
    }
}

function activateScavenger(card_id){
    var active_graveyard_id = bga.getElement({name: 'GRAVEYARD_' + this.getExplicitActiveColor()});
    var active_graveyard_cards_ids = bga.getElementsArray({parent: active_graveyard_id});
    var scavenger_food_cost = parseInt(bga.getElement({id: card_id}, "c_foodCost"));

    if (active_graveyard_cards_ids.length < scavenger_food_cost) {
        bga.cancel(_('You donnot have enough card in your graveyard do activate this effect'))
    } else {
        bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
        bga.addStyle(card_id, 'CLICKABLE_ROUNDED');
        this.expand(active_graveyard_id);
        bga.addStyle(active_graveyard_cards_ids, 'CLICKABLE');
        bga.log('Please select as much creatures as your Scavenger food cost to remove in order to feed the Scavenger');
    }
}

function scavengeSelectedCards(scavenger, selected_cards) {
    var scavenger_food_cost = parseInt(bga.getElement({id: scavenger}, "c_foodCost"));

    if(scavenger_food_cost === selected_cards.length) {
        this.removeCreature(selected_cards);
        this.modifyFoodCost(scavenger, 0, true);
        this.collapse();
        bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE_ROUNDED'}), 'CLICKABLE_ROUNDED' );
        bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE'}), 'CLICKABLE' );
        bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
        bga.log('Your scavenger is full');
    } else {
        bga.cancel(_('You need to remove as many cards as Scavenger food cost'));
    }
}

function desactivateScavenger(scavenger){
    this.collapse();
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE_ROUNDED'}), 'CLICKABLE_ROUNDED' );
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE'}), 'CLICKABLE' );
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
}

function hasCrane(card_id){
    if (bga.hasTag(card_id, 'CRANE')) {
            return true;
    }
}

function activateCrane(card_id){
    var active_board_id = bga.getElement({name: 'BOARD_' + this.getExplicitActiveColor()});
    var active_board_cards_ids = bga.getElementsArray({parent: active_board_id});

    // retire la grue des cartes qui seront clickable
    var index = active_board_cards_ids.indexOf(card_id);
    active_board_cards_ids.splice(index, 1);

    bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
    bga.addStyle(card_id, 'CLICKABLE_ROUNDED');
    bga.addStyle(active_board_cards_ids, 'CLICKABLE');
    bga.log('Please select a creature you want to feed');
}

function craneThisCreature(target, crane){
    var active_graveyard = bga.getElement({name: 'GRAVEYARD_' + this.getExplicitActiveColor()});

    bga.moveTo(crane, active_graveyard);
    this.modifyFoodCost(target, 0, true);
    bga.log("Your target is fed.")
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE_ROUNDED'}), 'CLICKABLE_ROUNDED' );
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE'}), 'CLICKABLE' );
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
}

function desactivateCrane(card_id){
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE_ROUNDED'}), 'CLICKABLE_ROUNDED' );
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_CLICKABLE'}), 'CLICKABLE' );
    bga.removeStyle( bga.getElements( {tag: 'sbstyle_selected'}), 'selected' );
}