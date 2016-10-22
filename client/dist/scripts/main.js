(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = (function(Game) {

  Game.Prefabs.Bullet = function(game, x, y, player, handleKilledFn){
    this.BULLET_SPEED = 500;

    this.player = player;
    this.game = player.game;

    Phaser.Sprite.call(this, player.game, 0, 0, 'bullet');
    
    this.anchor.setTo(0.5, 0.5);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    this.angle = -Math.PI/2;
    this.kill(); // set dead at first

    this.laserSound = this.game.add.audio('laserFx');

    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;

    // this.events.onKilled.add(this.handleKilled, this);
    if (handleKilledFn) {
      this.events.onKilled.add(handleKilledFn, this);
    }
  }

  Game.Prefabs.Bullet.prototype = Object.create(Phaser.Sprite.prototype);
  Game.Prefabs.Bullet.constructor = Game.Prefabs.Bullet;

  Game.Prefabs.Bullet.prototype.shoot = function() {
    this.rotation = this.player.rotation;

    // var pt = this.game.input.activePointer.position;
    // laser.angle = this.game.physics.arcade.angleBetween(laser, pt);

    this.xVel = Math.cos(this.rotation) * this.BULLET_SPEED;
    this.yVel = Math.sin(this.rotation) * this.BULLET_SPEED;
    this.laserSound.play();
  };

  Game.Prefabs.Bullet.prototype.shootFrom = function(data) {
    this.rotation = data.rotation;

    this.xVel = Math.cos(this.rotation) * this.BULLET_SPEED;
    this.yVel = Math.sin(this.rotation) * this.BULLET_SPEED;
  };

  Game.Prefabs.Bullet.prototype.update = function() {
    var laser = this;
    laser.body.velocity.x = this.xVel;
    laser.body.velocity.y = this.yVel;
  }

});
},{}],2:[function(require,module,exports){
module.exports = (function(Game) {

  Game.Prefabs.Enemies = function(game, count, enemyDesc, hero, parent) {
    var desc = this.desc = enemyDesc;

    // Loading
    Phaser.Group.call(this, game, parent);

    this.count = count = count || 5;

    this.livingEnemies = count;

    this.killedAll = true;

    var enemy,
        padding = 10;
    // Not sure why there is a bug here... bah
    for (var i = 0; i < count; i++) {
      enemy = this.add(
        new Game.Prefabs.Enemy(this.game, 0, 0, desc, enemy || hero)
      );
      enemy.x = enemy ? enemy.x : this.game.rnd.integerInRange(enemy.width, game.width - enemy.width);
      enemy.y = -(this.game.height + enemy.height/2 + i * (enemy.height));
    }
  };

  Game.Prefabs.Enemies.prototype = Object.create(Phaser.Group.prototype);
  Game.Prefabs.Enemies.constructor = Game.Prefabs.Enemies;

  Game.Prefabs.Enemies.prototype.update = function() {
    this.callAll('update');
  };

  Game.Prefabs.Enemies.prototype.reset = function(from, to, speed) {
    this.exists = true;
    this.livingEnemies = this.count;
    this.killedAll = true;

    var i = 0;
    this.forEach(function(enemy) {
      if (i === 0) {
        enemy.resetTarget(to);
      }

      enemy.reload(i, from, speed);
      i++;
    }, this);
  };

  Game.Prefabs.Enemies.prototype.updateStatus = function(enemy, autoKill){
    this.livingEnemies--;

    if(autoKill){
      this.killedAll = false;
    }

    if(this.livingEnemies === 0){
      this.exists = false;

      // Randomly activate a bonus if killed all the enemies
      if(this.killedAll){
        var rdm = this.game.rnd.integerInRange(1, this.count);
        
        if(rdm === 1) {
          this.game.state.getCurrentState().addBonus(enemy);
        }
      }
    }
  };

});
},{}],3:[function(require,module,exports){
module.exports = (function(Game) {
  Game.Prefabs.Enemy = function(game, x, y, desc, target){
    var desc = this.desc = desc;

    var type = 'enemy_' + desc.type || '1';
    // Super call to Phaser.sprite
    Phaser.Sprite.call(this, game, x, y, type);

    // Speed
    this.speed = desc.speed;

    // Target
    this.target = target;

    // Dead - Can't use alive because enemies follow each other
    this.dead = false;

    // Min Distance
    this.minDistance = 10;

    // Explosion
    this.explosion = this.game.add.sprite(0,0, 'explosion');
    this.explosion.anchor.setTo(0.5, 0.5);
    this.explosion.alpha = 0;

    // Enable physics on this object
    this.anchor.setTo(0.5, 0.5);
      this.game.physics.enable(this, Phaser.Physics.ARCADE);

      // Out of bounds callback
      this.events.onOutOfBounds.add(function(){
        this.die(true);
      }, this);
  }

  Game.Prefabs.Enemy.prototype = Object.create(Phaser.Sprite.prototype);
  Game.Prefabs.Enemy.constructor = Game.Prefabs.Enemy;

  Game.Prefabs.Enemy.prototype.update = function(){
    if(!Game.paused){
      // Change velocity to follow the target
      var distance, rotation;
      distance = this.game.math.distance(this.x, this.y, 
        this.target.x, 
        this.target.y);

      if (distance > this.minDistance) {
        rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);

        this.body.velocity.x = Math.cos(rotation) * this.speed;
        this.body.velocity.y = -(Math.sin(rotation) * this.speed);
      } else {
        this.body.velocity.setTo(0, 0);
      }

      // Active enemy
      if(this.y < this.game.height && !this.checkWorldBounds) {
        this.checkWorldBounds = true;
      }
    }
  };

  Game.Prefabs.Enemy.prototype.die = function(autoKill){
    if(!this.dead){
      this.dead = true;
      this.alpha = 0;

      // Explosion
      if(!autoKill){
        this.explosion.reset(this.x, this.y);
        this.explosion.angle = this.game.rnd.integerInRange(0, 360);
        this.explosion.alpha = 0;
        this.explosion.scale.x = 0.2;
        this.explosion.scale.y = 0.2;
        this.game.add.tween(this.explosion)
          .to({alpha: 1, angle: "+30"}, 200, Phaser.Easing.Linear.NONE, true, 0).to({alpha: 0, angle: "+30"}, 300, Phaser.Easing.Linear.NONE, true, 0);
        this.game.add.tween(this.explosion.scale)
          .to({x:1.5, y:1.5}, 500, Phaser.Easing.Cubic.Out, true, 0);
      }

      // Update parent group
      this.parent.updateStatus(this, autoKill);
    }
  };

  Game.Prefabs.Enemy.prototype.pause = function(){
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
  };

  Game.Prefabs.Enemy.prototype.reload = function(i, from){
    // this.x = this.game.width + this.width/2 + i*(this.width + 10);
    this.x = from;
    this.checkWorldBounds = false;
    this.dead = false;
    this.alpha = 1;
    this.y = -this.height + i*(this.height); //this.game.height + this.height/2 + i*(this.height + 10); //from;
  };

  Game.Prefabs.Enemy.prototype.resetTarget = function(to){
    this.target = new Phaser.Point(this.x || this.game.width/2, to);
  };
});
},{}],4:[function(require,module,exports){
module.exports = (function(Game) {

  Game.Prefabs.GameoverPanel = function(game, parent){
    // Super call to Phaser.Group
    Phaser.Group.call(this, game, parent);

    // Add panel
    this.panel = this.game.add.sprite(0, 0, 'panel');
    this.panel.width = this.game.width/2;
    this.panel.height = 150;
    this.add(this.panel);

    // Pause text
    var headerText = Game.winner ? "You won!" : "You lost :(";

    this.textPause = this.game.add
      .bitmapText(game.width/2, -50, 'architectsDaughter', headerText, 28);
    this.textPause.position.x = 
      this.game.width/2 - this.textPause.textWidth/2;
    this.add(this.textPause);

    // Score text
    this.textScore = this.game.add
      .bitmapText(game.width/2, 80, 'architectsDaughter', 'Score : 0', 22);
    this.textScore.position.x = this.game.width/2 - this.textScore.textWidth/2;
    this.add(this.textScore);

    // Highscore text
    this.textHighScore = this.game.add
      .bitmapText(game.width/2, 105, 'architectsDaughter', 'High Score : 0', 22);
    this.textHighScore.position.x = this.game.width/2 - this.textHighScore.textWidth/2;
    this.add(this.textHighScore);

    // Group pos
    this.y = -80;
    this.x = 0;
    this.alpha = 0;

    // Play button
    this.btnReplay = this.game.add.button(this.game.width/2-32, 15, 'btn', this.replay, this, 3, 2, 3, 2);
    this.btnReplay.anchor.setTo(0.5, 0);
    this.add(this.btnReplay);

    // Btn Menu
    this.btnMenu = this.game.add.button(this.game.width/2+28, 15, 'btn', function(){
      this.game.state.getCurrentState().goToMenu();
    }, this, 5, 4, 5, 4);
    this.btnMenu.anchor.setTo(0.5, 0);
    this.add(this.btnMenu);
  };

  Game.Prefabs.GameoverPanel.prototype = Object.create(Phaser.Group.prototype);
  Game.Prefabs.GameoverPanel.constructor = Game.Prefabs.GameoverPanel;

  Game.Prefabs.GameoverPanel.prototype.show = function(score){
    score = score || 0;

    var highScore;
    var beated = false;

    console.log('winner', Game.winner);
    localStorage.setItem('highScore', 0);

    if(!!localStorage){
      highScore = parseInt(localStorage.getItem('highScore'), 10);

      if(!highScore || highScore < score){
        highScore = score;
        localStorage.setItem('highScore', highScore.toString());

        // Add new sprite if best score beated
        if(score > 0){
          beated = true;
          this.newScore = this.game.add.sprite(0, 120, 'new');
          this.newScore.anchor.setTo(0.5, 0.5);
          this.add(this.newScore);
        }
      }
    } else {
      highScore = 0;
    }

    this.textHighScore.setText('High Score: ' + highScore.toString());

    // Center text
    var scoreText = 'Score: ' + score.toString();
    this.textScore.setText(scoreText);

    this.textScore.update();
    this.textScore.position.x = this.game.width/2 - this.textScore.textWidth/2;

    this.textHighScore.update();
    this.textHighScore.position.x = this.game.width/2 - this.textHighScore.textWidth/2;

    this.panel.position.x = this.game.width/2  - this.panel.width/2;

    if(beated){
      this.newScore.x = this.textHighScore.position.x - 30;
    }

    // Show panel
    this.game.add.tween(this)
      .to({
          alpha:1, 
          y:this.game.height/2 - this.panel.height/2}, 
        1000, 
        Phaser.Easing.Exponential.Out, true, 0);
  };

  Game.Prefabs.GameoverPanel.prototype.replay = function(){
    // Start
    Game.reset();
    Game.multiplayer = true; // Hardcoded for demo
    this.game.state.start('Play');
  };
});
},{}],5:[function(require,module,exports){
module.exports = (function(Game) {

  require('./player')(Game);
  require('./gameover_panel')(Game);
  require('./pause_panel')(Game);

  require('./enemies')(Game);
  require('./enemy')(Game);

  require('./laser')(Game);
  require('./bullet')(Game);
});
},{"./bullet":1,"./enemies":2,"./enemy":3,"./gameover_panel":4,"./laser":6,"./pause_panel":7,"./player":8}],6:[function(require,module,exports){
module.exports = (function(Game) {
  Game.Prefabs.Laser = function(game, x, y){
    // Super call to Phaser.sprite
    Phaser.Sprite.call(this, game, x, y, 'laser');

    // Centered anchor
    this.anchor.setTo(0.5, 0.5);

    // Speed
    this.speed = 150;

    // Kill when out of world
    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;

    // Enable physics
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    this.tween = this.game.add.tween(this).to({angle:-360}, 3000, Phaser.Easing.Linear.NONE, true, 0, Number.POSITIVE_INFINITY);
  }

  Game.Prefabs.Laser.prototype = Object.create(Phaser.Sprite.prototype);
  Game.Prefabs.Laser.constructor = Game.Prefabs.Laser;

  Game.Prefabs.Laser.prototype.update = function(){
    if(!Game.paused){
      this.body.velocity.x = -this.speed;
    }else{
      this.body.velocity.x = 0;
    }
  };

  Game.Prefabs.Laser.prototype.reload = function(speed){
    this.alpha = 1;
    this.speed = speed;
    this.scale.x = 1;
    this.scale.y = 1;
  };

  Game.Prefabs.Laser.prototype.die = function(){
    this.game.add.tween(this).to({alpha: 0}, 150, Phaser.Easing.Cubic.Out, true, 0);
    this.game.add.tween(this.scale).to({x:1.5, y:1.5}, 150, Phaser.Easing.Cubic.Out, true, 0);
  };

  Game.Prefabs.Laser.prototype.pause = function(){
    this.tween.pause();
  };

  Game.Prefabs.Laser.prototype.resume = function(){
    this.tween.resume();
  };
});
},{}],7:[function(require,module,exports){
module.exports = (function(Game) {

  Game.Prefabs.PausePanel = function(game, parent){
    // Super call to Phaser.Group
    Phaser.Group.call(this, game, parent);

    // Add panel
    this.panel = this.game.add.sprite(0, 0, 'panel');
    this.panel.width = 480;
    this.panel.height = 80;
    this.add(this.panel);

    // Pause text
    this.textPause = this.game.add.bitmapText(game.width/2, -42, 'kenpixelblocks', 'Pause', 28);
    this.textPause.position.x = this.game.width/2 - this.textPause.textWidth/2;
    this.add(this.textPause);

    // Group pos
    this.y = -80;
    this.x = 0;
    this.alpha = 0;

    // Play button
    this.btnPlay = this.game.add.button(this.game.width/2-32, 15, 'btn', this.unPause, this, 3, 2, 3, 2);
    this.btnPlay.anchor.setTo(0.5, 0);
    this.add(this.btnPlay);

    // Btn Menu
    this.btnMenu = this.game.add.button(this.game.width/2+28, 15, 'btn', function(){
      this.game.state.getCurrentState().goToMenu();
    }, this, 5, 4, 5, 4);
    this.btnMenu.anchor.setTo(0.5, 0);
    this.add(this.btnMenu);
  };

  Game.Prefabs.PausePanel.prototype = Object.create(Phaser.Group.prototype);
  Game.Prefabs.PausePanel.constructor = Game.Prefabs.PausePanel;

  Game.Prefabs.PausePanel.prototype.show = function(){
    this.game.add.tween(this).to({alpha:1, y:this.game.height/2 - this.panel.height/2}, 1000, Phaser.Easing.Exponential.Out, true, 0);
  };

  Game.Prefabs.PausePanel.prototype.unPause = function(){
    this.game.add.tween(this).to({alpha:0, y:-80}, 1000, Phaser.Easing.Exponential.Out, true, 0);
    this.game.state.getCurrentState().playGame();
  };

});
},{}],8:[function(require,module,exports){
module.exports = (function(Game) {

  Game.Prefabs.Player = function(game, x, y, target, id) {
    this.id = id;
    if (target) {
      Phaser.Sprite.call(this, game, x, y, 'hero');
      // Target: mouse
      this.target     = target;

      // Follow pointer
      this.follow = false;

      // Minimum away
      this.minDistance = 10;

      // Speed
      this.speed      = 200;

      // Lives
      this.lives      = 3;

      // Shot delay
      this.shotDelay  = 100;

      // Number of bullets per shot
      this.numBullets   = 10;
      this.timerBullet;

      this.shieldsEnabled = false;
      this.timerShield;
      this.shield = this.game.add.sprite(0, 0, 'shield');
      this.shield.anchor.setTo(0.5, 0.5);
      this.shield.alpha = 0

      // Scale
      this.scale.setTo(1.2, 1.2);
    } else {
      Phaser.Sprite.call(this, game, x, y, 'hero');

      this.scale.setTo(0.5, 0.5);
      this.alpha = 0.8;
      this.x = x;
      this.y = y;

      // State queue
      this.stateQueue = [];
      this.minQueueSize = 10;
      this.maxQueueSize = 30;
      this.previousStateTime = 0;
    }

    // Explosion
    this.explosion = this.game.add.sprite(0,0, 'explosion');
    this.explosion.anchor.setTo(0.5, 0.5);
    this.explosion.alpha = 0;

    this.health = 100;
    // Anchor
    this.anchor.setTo(0.5, 0.5);
    // Rotate 90s so it's facing up
    this.rotation = -Math.PI/2;

    this.game.physics.enable(this, Phaser.Physics.ARCADE);
  };

  Game.Prefabs.Player.prototype   = Object.create(Phaser.Sprite.prototype);
  Game.Prefabs.Player.constructor = Game.Prefabs.Player;

  // Update
  Game.Prefabs.Player.prototype.update = function() {
    if (this.target) {
      this.updateHero();
    } else {
      this.updateRemote();
    }
  }

  Game.Prefabs.Player.prototype.onUpdateFromServer = function(data) {
    if (this.stateQueue.length > this.maxQueueSize) {
      this.stateQueue.splice(this.minQueueSize, this.maxQueueSize - this.minQueueSize);
    }
    this.stateQueue.unshift(data);
  };

  Game.Prefabs.Player.prototype.updateHero = function() {
    var distance, rotation;
      // Follow pointer
    if (this.follow) {
      distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);

      if (distance > this.minDistance) {
        rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);

        this.body.velocity.x = Math.cos(rotation) * this.speed * Math.min(distance / 120, 2);
        this.body.velocity.y = Math.sin(rotation) * this.speed * Math.min(distance / 120, 2);
        this.rotation = rotation;
      } else {
        this.body.velocity.setTo(0, 0);
      }
    } else {
      this.body.velocity.setTo(0, 0);
    }

    // Shields
    if (this.shieldsEnabled) {
      this.shield.x = this.x;
      this.shield.y = this.y;
      this.shield.rotation = this.rotation;
    }
  };

  Game.Prefabs.Player.prototype.updateRemote = function() {
    if (this.stateQueue.length > this.minQueueSize) {
      var earliestQueue = this.stateQueue.pop();

      
      if (!this.previousStateTime) {
        this.previousStateTime = new Date().getTime();
      }

      var tweenTime = Math.abs(this.previousStateTime - (earliestQueue.timestamp + 10));
      this.game.add.tween(this)
        .to({
          x: earliestQueue.x,
          y: earliestQueue.y,
          rotation: earliestQueue.rotation
        }, tweenTime, 
        Phaser.Easing.Linear.None, true, 0);

      this.previousStateTime = earliestQueue.timestamp;
    }
  };

  Game.Prefabs.Player.prototype.die = function(autoKill){
    if(!this.dead){
      this.dead = true;
      this.alpha = 0;

      // Explosion
      if(!autoKill){
        this.showExplosion();
      }
    }
  };

  Game.Prefabs.Player.prototype.wasHitBy = function(bullet, player) {
    if (!this.shieldsEnabled) {
      this.health -= 10;

      if (this.health <= 0) {
        this.die();
      } else {
        this.enableShield(0.3);
        this.showExplosion();
      }

      return true;
    }
  };

  Game.Prefabs.Player.prototype.showExplosion = function() {
    this.explosion.reset(this.x, this.y);
    this.explosion.alpha = 0;
    this.explosion.scale.x = 0.2;
    this.explosion.scale.y = 0.2;
    this.game.add.tween(this.explosion)
    .to({alpha: 1, angle: "+30"}, 200, Phaser.Easing.Linear.NONE, true, 0).to({alpha: 0, angle: "+30"}, 300, Phaser.Easing.Linear.NONE, true, 0);
    this.game.add.tween(this.explosion.scale)
    .to({x:1.5, y:1.5}, 500, Phaser.Easing.Cubic.Out, true, 0);
  };

  Game.Prefabs.Player.prototype.enableShield = function(duration) {
    this.shieldsEnabled = true;

    if (this.timerShield && !this.timerShield.expired) {
      this.timerShield.destroy();
    }

    this.timerShield = this.game.time.create(true);
    this.timerShield.add(Phaser.Timer.SECOND * duration, this.disableShield, this);
    this.timerShield.start();

    this.game.add.tween(this.shield)
      .to({alpha: 1}, 300, Phaser.Easing.Cubic.Out, true, 0);
  };

  Game.Prefabs.Player.prototype.disableShield = function() {
    this.game.add.tween(this.shield)
      .to({alpha: 0}, 300, 
        Phaser.Easing.Linear.NONE, 
        true,
        0, 6, true).onComplete.add(function() {
          this.shieldsEnabled = false;
        }, this);
  }
});
},{}],9:[function(require,module,exports){
angular.module('app.game')
.directive('gameCanvas', function($window, mySocket, $injector) {

  var linkFn = function(scope, ele, attrs) {
    var w = angular.element($window);
    w.bind('resize', function(evt) {
      // If the window is resized
    });

    mySocket.then(function(sock) {
      require('./main.js')(
        ele, scope, sock, 
        scope.ngModel, 
        scope.mapId, 
        $injector);
    });
  };

  return {
    scope: {
      ngModel: '=',
      mapId: '='
    },
    template: '<div id="game-canvas"></div>',
    compile: function(iEle, iAttrs) {
      return linkFn;
    }
  }
})
},{"./main.js":14}],10:[function(require,module,exports){
angular.module('app.game')
.controller('GameController', function($scope, $stateParams, mySocket, User) {
  $scope.players = [];
  $scope.mapId = $stateParams.id || '1';

  $scope.$on('game:getAvailablePlayers', function(players) {
    $scope.players = players;
  });

  $scope.$on('$destroy', function() {
    $scope.$emit('player leaving');
  });

});
},{}],11:[function(require,module,exports){
module.exports =
angular.module('app.game', ['ui.router', 'app.user'])
.config(function($stateProvider) {
  $stateProvider
    .state('game', {
      url: '/game',
      abstract: true,
      templateUrl: '/scripts/game/template.html'
    })
    .state('game.play', {
      url: '/:id',
      template: '<div>\
        <div id="gameCanvas" game-canvas="players" map-id="mapId"></div>\
      </div>',
      controller: 'GameController',
      onEnter: function(Game) {
        Game.playing = true;
      },
      onExit: function(Game) {
        Game.playing = false;
      }
    })
})

require('./game_controller.js')
require('./game_canvas.js');
},{"./game_canvas.js":9,"./game_controller.js":10}],12:[function(require,module,exports){
'use strict';


/**
* @author       Jeremy Dowell <jeremy@codevinsky.com>
* @license      {@link http://www.wtfpl.net/txt/copying/|WTFPL}
*/

/**
* Creates a new `Juicy` object.
*
* @class Phaser.Plugin.Juicy
* @constructor
*
* @param {Phaser.Game} game Current game instance.
*/

Phaser.Plugin.Juicy = function (game) {

  Phaser.Plugin.call(this, game);

  /**
  * @property {Phaser.Rectangle} _boundsCache - A reference to the current world bounds.
  * @private
  */
  this._boundsCache = Phaser.Utils.extend(false, {}, this.game.world.bounds);

  /**
  * @property {number} _shakeWorldMax - The maximum world shake radius
  * @private
  */
  this._shakeWorldMax = 20;

  /**
  * @property {number} _shakeWorldTime - The maximum world shake time
  * @private
  */
  this._shakeWorldTime = 0;

  /**
  * @property {number} _trailCounter - A count of how many trails we're tracking
  * @private
  */  
  this._trailCounter = 0;

  /**
  * @property {object} _overScales - An object containing overscaling configurations
  * @private
  */  
  this._overScales = {};

  /**
  * @property {number} _overScalesCounter - A count of how many overScales we're tracking
  * @private
  */  
  this._overScalesCounter = 0;
};


Phaser.Plugin.Juicy.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.Juicy.prototype.constructor = Phaser.Plugin.Juicy;



/**
* Creates a new `Juicy.ScreenFlash` object.
*
* @class Phaser.Plugin.Juicy.ScreenFlash
* @constructor
*
* @param {Phaser.Game} game -  Current game instance.
* @param {string} color='white' - The color to flash the screen.
* @memberof Phaser.Plugin.Juicy
*/
Phaser.Plugin.Juicy.ScreenFlash = function(game, color) {
  color = color || 'white';
  var bmd = game.add.bitmapData(game.width, game.height);
  bmd.ctx.fillStyle = 'white';
  bmd.ctx.fillRect(0,0, game.width, game.height);

  Phaser.Sprite.call(this, game, 0,0, bmd);
  this.alpha = 0;
};

Phaser.Plugin.Juicy.ScreenFlash.prototype = Object.create(Phaser.Sprite.prototype);
Phaser.Plugin.Juicy.ScreenFlash.prototype.constructor = Phaser.Plugin.Juicy.ScreenFlash;


/*
* Flashes the screen
*
* @param {number} [maxAlpha=1] - The maximum alpha to flash the screen to
* @param {number} [duration=100] - The duration of the flash in milliseconds
* @method Phaser.Plugin.Juicy.ScreenFlash.prototype.flash
* @memberof Phaser.Plugin.Juicy.ScreenFlash
*/
Phaser.Plugin.Juicy.ScreenFlash.prototype.flash = function(maxAlpha, duration) {
  maxAlpha = maxAlpha || 1;
  duration = duration || 100;
  var flashTween = this.game.add.tween(this).to({alpha: maxAlpha}, 100, Phaser.Easing.Bounce.InOut, true,0, 0, true);
  flashTween.onComplete.add(function() {
    this.alpha = 0;
  }, this);
};

/**
* Creates a new `Juicy.Trail` object.
*
* @class Phaser.Plugin.Juicy.Trail
* @constructor
*
* @param {Phaser.Game} game -  Current game instance.
* @param {number} [trailLength=100] - The length of the trail
* @param {number} [color=0xFFFFFF] - The color of the trail
* @memberof Phaser.Plugin.Juicy
*/
Phaser.Plugin.Juicy.Trail = function(game, trailLength, color) {
  Phaser.Graphics.call(this, game, 0,0);
  
  /**
  * @property {Phaser.Sprite} target - The target sprite whose movement we want to create the trail from
  */
  this.target = null;
  /**
  * @property {number} trailLength - The number of segments to use to create the trail
  */
  this.trailLength = trailLength || 100;
  /**
  * @property {number} trailWidth - The width of the trail
  */
  this.trailWidth = 15.0;

  /**
  * @property {boolean} trailScale - Whether or not to taper the trail towards the end
  */
  this.trailScaling = false;

  /**
  * @property {Phaser.Sprite} trailColor - The color of the trail
  */
  this.trailColor = color || 0xFFFFFF;
  
  /**
  * @property {Array<Phaser.Point>} _segments - A historical collection of the previous position of the target
  * @private
  */
  this._segments = [];
  /**
  * @property {Array<number>} _verts - A collection of vertices created from _segments
  * @private
  */
  this._verts = [];
  /**
  * @property {Array<Phaser.Point>} _segments - A collection of indices created from _verts
  * @private
  */
  this._indices = [];

};

Phaser.Plugin.Juicy.Trail.prototype = Object.create(Phaser.Graphics.prototype);
Phaser.Plugin.Juicy.Trail.prototype.constructor = Phaser.Plugin.Juicy.Trail;

/**
* Updates the Trail if a target is set
*
* @method Phaser.Plugin.Juicy.Trail#update
* @memberof Phaser.Plugin.Juicy.Trail
*/

Phaser.Plugin.Juicy.Trail.prototype.update = function() {
  if(this.target) {
    this.x = this.target.x;
    this.y = this.target.y;
    this.addSegment(this.target.x, this.target.y);
    this.redrawSegments(this.target.x, this.target.y);
  }
};

/**
* Adds a segment to the segments list and culls the list if it is too long
* 
* @param {number} [x] - The x position of the point
* @param {number} [y] - The y position of the point
* 
* @method Phaser.Plugin.Juicy.Trail#addSegment
* @memberof Phaser.Plugin.Juicy.Trail
*/
Phaser.Plugin.Juicy.Trail.prototype.addSegment = function(x, y) {
  var segment;

  while(this._segments.length > this.trailLength) {
    segment = this._segments.shift();
  }
  if(!segment) {
    segment = new Phaser.Point();
  }

  segment.x = x;
  segment.y = y;

  this._segments.push(segment);
};


/**
* Creates and draws the triangle trail from segments
* 
* @param {number} [offsetX] - The x position of the object
* @param {number} [offsetY] - The y position of the object
* 
* @method Phaser.Plugin.Juicy.Trail#redrawSegment
* @memberof Phaser.Plugin.Juicy.Trail
*/
Phaser.Plugin.Juicy.Trail.prototype.redrawSegments = function(offsetX, offsetY) {
  this.clear();
  var s1, // current segment
      s2, // previous segment
      vertIndex = 0, // keeps track of which vertex index we're at
      offset, // temporary storage for amount to extend line outwards, bigger = wider
      ang, //temporary storage of the inter-segment angles
      sin = 0, // as above
      cos = 0; // again as above

  // first we make sure that the vertice list is the same length as we we want
  // each segment (except the first) will create to vertices with two values each
  if (this._verts.length !== (this._segments.length -1) * 4) {
    // if it's not correct, we clear the entire list
    this._verts = [];
  }

  // now we loop over all the segments, the list has the "youngest" segment at the end
  var prevAng = 0;
  
  for(var j = 0; j < this._segments.length; ++j) {
    // store the active segment for convenience
    s1 = this._segments[j];

    // if there's a previous segment, time to do some math
    if(s2) {
      // we calculate the angle between the two segments
      // the result will be in radians, so adding half of pi will "turn" the angle 90 degrees
      // that means we can use the sin and cos values to "expand" the line outwards
      ang = Math.atan2(s1.y - s2.y, s1.x - s2.x) + Math.PI / 2;
      sin = Math.sin(ang);
      cos = Math.cos(ang);

      // now it's time to creat ethe two vertices that will represent this pair of segments
      // using a loop here is probably a bit overkill since it's only two iterations
      for(var i = 0; i < 2; ++i) {
        // this makes the first segment stand out to the "left" of the line
        // annd the second to the right, changing that magic number at the end will alther the line width
        offset = ( -0.5 + i / 1) * this.trailWidth;

        // if trail scale effect is enabled, we scale down the offset as we move down the list
        if(this.trailScaling) {
          offset *= j / this._segments.length;
        }

        // finally we put to values in the vert list
        // using the segment coordinates as a base we add the "extended" point
        // offsetX and offsetY are used her to move the entire trail
        this._verts[vertIndex++] = s1.x + cos * offset - offsetX;
        this._verts[vertIndex++] = s1.y + sin * offset - offsetY;
      }
    }
    // finally store the current segment as the previous segment and go for another round
    s2 = s1.copyTo({});
  }
  // we need at least four vertices to draw something
  if(this._verts.length >= 8) {
    // now, we have a triangle "strip", but flash can't draw that without 
    // instructions for which vertices to connect, so it's time to make those
    
    // here, we loop over all the vertices and pair them together in triangles
    // each group of four vertices forms two triangles
    for(var k = 0; k < this._verts.length; k++) {
      this._indices[k * 6 + 0] = k * 2 + 0;
      this._indices[k * 6 + 1] = k * 2 + 1;
      this._indices[k * 6 + 2] = k * 2 + 2;
      this._indices[k * 6 + 3] = k * 2 + 1;
      this._indices[k * 6 + 4] = k * 2 + 2;
      this._indices[k * 6 + 5] = k * 2 + 3;
    }
    this.beginFill(this.trailColor);
    this.drawTriangles(this._verts, this._indices);
    this.endFill();
    
  }
};






/**
* Add a Sprite reference to this Plugin.
* All this plugin does is move the Sprite across the screen slowly.
* @type {Phaser.Sprite}
*/

/**
* Begins the screen shake effect
* 
* @param {number} [duration=20] - The duration of the screen shake
* @param {number} [strength=20] - The strength of the screen shake
* 
* @method Phaser.Plugin.Juicy#redrawSegment
* @memberof Phaser.Plugin.Juicy
*/
Phaser.Plugin.Juicy.prototype.shake = function (duration, strength) {
  this._shakeWorldTime = duration || 20;
  this._shakeWorldMax = strength || 20;
  this.game.world.setBounds(this._boundsCache.x - this._shakeWorldMax, this._boundsCache.y - this._shakeWorldMax, this._boundsCache.width + this._shakeWorldMax, this._boundsCache.height + this._shakeWorldMax);
};


/**
* Creates a 'Juicy.ScreenFlash' object
*
* @param {string} color - The color of the screen flash
* 
* @type {Phaser.Plugin.Juicy.ScreenFlash}
*/

Phaser.Plugin.Juicy.prototype.createScreenFlash = function(color) {
    return new Phaser.Plugin.Juicy.ScreenFlash(this.game, color);
};


/**
* Creates a 'Juicy.Trail' object
*
* @param {number} length - The length of the trail
* @param {number} color - The color of the trail
* 
* @type {Phaser.Plugin.Juicy.Trail}
*/
Phaser.Plugin.Juicy.prototype.createTrail = function(length, color) {
  return new Phaser.Plugin.Juicy.Trail(this.game, length, color);
};


/**
* Creates the over scale effect on the given object
*
* @param {Phaser.Sprite} object - The object to over scale
* @param {number} [scale=1.5] - The scale amount to overscale by
* @param {Phaser.Point} [initialScale=new Phaser.Point(1,1)] - The initial scale of the object
* 
*/
Phaser.Plugin.Juicy.prototype.overScale = function(object, scale, initialScale) {
  scale = scale || 1.5;
  var id = this._overScalesCounter++;
  initialScale = initialScale || new Phaser.Point(1,1);
  var scaleObj = this._overScales[id];
  if(!scaleObj) {
    scaleObj = {
      object: object,
      cache: initialScale.copyTo({})
    };
  } 
  scaleObj.scale = scale;
  
  this._overScales[id] = scaleObj;
};

/**
* Creates the jelly effect on the given object
*
* @param {Phaser.Sprite} object - The object to gelatinize
* @param {number} [strength=0.2] - The strength of the effect
* @param {number} [delay=0] - The delay of the snap-back tween. 50ms are automaticallly added to whatever the delay amount is.
* @param {Phaser.Point} [initialScale=new Phaser.Point(1,1)] - The initial scale of the object
* 
*/
Phaser.Plugin.Juicy.prototype.jelly = function(object, strength, delay, initialScale) {
  strength = strength || 0.2;
  delay = delay || 0;
  initialScale = initialScale ||  new Phaser.Point(1, 1);
  
  this.game.add.tween(object.scale).to({x: initialScale.x + (initialScale.x * strength)}, 50, Phaser.Easing.Quadratic.InOut, true, delay)
  .to({x: initialScale.x}, 600, Phaser.Easing.Elastic.Out, true);

  this.game.add.tween(object.scale).to({y: initialScale.y + (initialScale.y * strength)}, 50, Phaser.Easing.Quadratic.InOut, true, delay + 50)
  .to({y: initialScale.y}, 600, Phaser.Easing.Elastic.Out, true);
};

/**
* Creates the mouse stretch effect on the given object
*
* @param {Phaser.Sprite} object - The object to mouse stretch
* @param {number} [strength=0.5] - The strength of the effect
* @param {Phaser.Point} [initialScale=new Phaser.Point(1,1)] - The initial scale of the object
* 
*/
Phaser.Plugin.Juicy.prototype.mouseStretch = function(object, strength, initialScale) {
    strength = strength || 0.5;
    initialScale = initialScale || new Phaser.Point(1,1);
    object.scale.x = initialScale.x + (Math.abs(object.x - this.game.input.activePointer.x) / 100) * strength;
    object.scale.y = initialScale.y + (initialScale.y * strength) - (object.scale.x * strength);
};

/**
* Runs the core update function and causes screen shake and overscaling effects to occur if they are queued to do so.
*
* @method Phaser.Plugin.Juicy#update
* @memberof Phaser.Plugin.Juicy
*/
Phaser.Plugin.Juicy.prototype.update = function () {
  var scaleObj;
  // Screen Shake
  if(this._shakeWorldTime > 0) { 
    var magnitude = (this._shakeWorldTime / this._shakeWorldMax) * this._shakeWorldMax;
    var x = this.game.rnd.integerInRange(-magnitude, magnitude);
    var y = this.game.rnd.integerInRange(-magnitude, magnitude);

    this.game.camera.x = x;
    this.game.camera.y = y;
    this._shakeWorldTime--;
    if(this._shakeWorldTime <= 0) {
      this.game.world.setBounds(this._boundsCache.x, this._boundsCache.x, this._boundsCache.width, this._boundsCache.height);
    }
  }

  // over scales
  for(var s in this._overScales) {
    if(this._overScales.hasOwnProperty(s)) {
      scaleObj = this._overScales[s];
      if(scaleObj.scale > 0.01) {
        scaleObj.object.scale.x = scaleObj.scale * scaleObj.cache.x;
        scaleObj.object.scale.y = scaleObj.scale * scaleObj.cache.y;
        scaleObj.scale -= this.game.time.elapsed * scaleObj.scale * 0.35;
      } else {
        scaleObj.object.scale.x = scaleObj.cache.x;
        scaleObj.object.scale.y = scaleObj.cache.y;
        delete this._overScales[s];
      }
    }
  }
};

// for browserify compatibility
if(module && module.exports) {
  module.exports = Phaser.Plugin.Juicy;
}



// Draw Triangles Polyfill for back compatibility
if(!Phaser.Graphics.prototype.drawTriangle) {
  Phaser.Graphics.prototype.drawTriangle = function(points, cull) {
      var triangle = new Phaser.Polygon(points);
      if (cull) {
          var cameraToFace = new Phaser.Point(this.game.camera.x - points[0].x, this.game.camera.y - points[0].y);
          var ab = new Phaser.Point(points[1].x - points[0].x, points[1].y - points[0].y);
          var cb = new Phaser.Point(points[1].x - points[2].x, points[1].y - points[2].y);
          var faceNormal = cb.cross(ab);
          if (cameraToFace.dot(faceNormal) > 0) {
              this.drawPolygon(triangle);
          }
      } else {
          this.drawPolygon(triangle);
      }
      return;
  };

  /*
  * Draws {Phaser.Polygon} triangles 
  *
  * @param {Array<Phaser.Point>|Array<number>} vertices - An array of Phaser.Points or numbers that make up the vertices of the triangles
  * @param {Array<number>} {indices=null} - An array of numbers that describe what order to draw the vertices in
  * @param {boolean} [cull=false] - Should we check if the triangle is back-facing
  * @method Phaser.Graphics.prototype.drawTriangles
  */

  Phaser.Graphics.prototype.drawTriangles = function(vertices, indices, cull) {

      var point1 = new Phaser.Point(),
          point2 = new Phaser.Point(),
          point3 = new Phaser.Point(),
          points = [],
          i;

      if (!indices) {
          if(vertices[0] instanceof Phaser.Point) {
              for(i = 0; i < vertices.length / 3; i++) {
                  this.drawTriangle([vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]], cull);
              }
          } else {
              for (i = 0; i < vertices.length / 6; i++) {
                  point1.x = vertices[i * 6 + 0];
                  point1.y = vertices[i * 6 + 1];
                  point2.x = vertices[i * 6 + 2];
                  point2.y = vertices[i * 6 + 3];
                  point3.x = vertices[i * 6 + 4];
                  point3.y = vertices[i * 6 + 5];
                  this.drawTriangle([point1, point2, point3], cull);
              }

          }
      } else {
          if(vertices[0] instanceof Phaser.Point) {
              for(i = 0; i < indices.length /3; i++) {
                  points.push(vertices[indices[i * 3 ]]);
                  points.push(vertices[indices[i * 3 + 1]]);
                  points.push(vertices[indices[i * 3 + 2]]);
                  if(points.length === 3) {
                      this.drawTriangle(points, cull);    
                      points = [];
                  }
                  
              }
          } else {
              for (i = 0; i < indices.length; i++) {
                  point1.x = vertices[indices[i] * 2];
                  point1.y = vertices[indices[i] * 2 + 1];
                  points.push(point1.copyTo({}));
                  if (points.length === 3) {
                      this.drawTriangle(points, cull);
                      points = [];
                  }
              }
          }
      }
  };
}
},{}],13:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
  } else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);
},{}],14:[function(require,module,exports){
module.exports =
(function(ele, scope, socket, maps, mapId, injector) {

  // Require lib
  require('./lib/juicy');
  var UUID = require('./lib/uuid');
  
  var height  = parseInt(ele.css('height'), 10),
      width   = parseInt(ele.css('width'), 10);
  var game = new Phaser.Game(width, height, Phaser.AUTO, 'game-canvas');

  var Game    = require('./states'),
      states  = Game.States;

  game.state.add('Boot', states.Boot);
  game.state.add('Preloader', states.Preloader);
  game.state.add('MainMenu', states.MainMenu);
  game.state.add('Play', states.Play);
  // game.state.add('Game', require('./states/game'));
  // game.state.add('NextLevel', require('./states/next_level'));
  game.state.add('GameOver', states.GameOver);

  game.mapId = mapId;
  game.socket = socket;
  game.scope  = scope;
  Game.maps           = maps;
  Game.remotePlayers = [];

  var user  = injector.get('User'),
      g     = Game;

  g.socket        = socket;
  g.mapId         = mapId;
  g.currentPlayer = user.getCurrentUser();

  // Turn off music
  scope.$on('game:toggleMusic', function() {
    game.state.states.Preloader.toggleMusic();
  });

  // Cleanup
  scope.$on('$destroy', function() {
    socket.emit('playerLeftMap', {
      playerId: g.sid,
      mapId: g.mapId
    });
    game.destroy();
  });

  // Network socket events
  Game.connected = true;
  console.log('connected data data', socket, g.currentPlayer);
  // g.sid     = data.id;
  g.playerName = 'Ari';
  // g.playerName = prompt("Please enter your name") || 'Player';
  g.socket.emit('setPlayerName', { name: g.playerName });

  g.socket.on('playerDetails', function(data) {
    g.sid = data.id;
    console.log('GAME GAME', game);
    game.state.start('Boot');
  });

});
},{"./lib/juicy":12,"./lib/uuid":13,"./states":17}],15:[function(require,module,exports){
module.exports = (function(Game) {

  Game.States.Boot = function(game) {};

  Game.States.Boot.prototype = {
    resizeCanvasToContainerElement: function() {
      var canvas = this.game.canvas;

      var canvas          = this.game.canvas,
          containerWidth  = canvas.clientWidth,
          containerHeight = canvas.clientHeight;

      var xScale = containerWidth / this.width;
      var yScale = containerHeight / this.height;
      var newScale = Math.min( xScale, yScale );

      this.scale.width = newScale * this.game.width;
      this.scale.height = newScale * this.game.height;
      this.scale.setSize(containerWidth, containerHeight);

      Game.width  = this.game.width;
      Game.height = this.game.height;
    },
    init: function () {
      this.input.maxPointers = 1;
      this.stage.disableVisibilityChange = true;

      if (this.game.device.desktop) {
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // this.scale.setMinMax(480, 260, 2048, 1536);
        // this.scale.pageAlignHorizontally = true;
        // this.scale.pageAlignVertically = true;
      } else {
        this.game.stage.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.stage.scale.minWidth =  480;
        this.game.stage.scale.minHeight = 260;
        this.game.stage.scale.maxWidth = 640;
        this.game.stage.scale.maxHeight = 480;
        this.game.stage.scale.forceLandscape = true;
        this.game.stage.scale.pageAlignHorizontally = true;
      }

      this.scale.setResizeCallback(this.handleResizeEvent, this);

      this.scale.setScreenSize(true);
      this.scale.refresh();
    },
    preload: function(){
              //  Here we load the assets required for our preloader (in this case a background and a loading bar)
      this.load.image('menu_background', 'assets/menu_background.jpg');
      this.load.image('preloader', 'assets/preloader.gif');
      this.load.json('levels', 'assets/levels.json');
    },

    create: function(){
      if (this.game.device.desktop) {
       this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; //always show whole game
        this.game.stage.scale.pageAlignHorizontally = true;
      } else {
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.forceLandscape = false;
        this.scale.pageAlignHorizontally = true;
      }
      this.resizeCanvasToContainerElement();
      Game.initialized = true;
      this.state.start('Preloader');
    },

    handleResizeEvent: function() {
      this.resizeCanvasToContainerElement();
    }
  }

});
},{}],16:[function(require,module,exports){
module.exports = (function(Game) {

  Game.States.GameOver = function(game) {

  };

  Game.States.GameOver.prototype.create = function() {
    if (Game.multiplayer) {
      // Gameover panel
      this.gameoverPanel = new Game.Prefabs.GameoverPanel(this.game);
      this.game.add.existing(this.gameoverPanel);

      this.gameoverPanel.show(Game.score);
    }
  };
});
},{}],17:[function(require,module,exports){
var Game = {
  name: 'ng-invader',
  // States of our game
  States: {},
  // Prefabs
  Prefabs: {},
  // Levels
  Levels: {},

  orientated: true,

  backgroundX: 0,
  backgroundY: 0,

  paused: true,

  multiplayer: true,

  // Map
  mapData: {},

  // Socket
  socket: {},
  remotePlayers: [],
  toAdd: [],
  toRemove: [],
  latency: 0,

  width: 800,
  height: 600,

  // Helpers
  cpc: function(x) {
    return x * 64 + 32;
  },

  playerById: function(id) {
    for (var i = 0; i < this.remotePlayers.length; i++) {
      if (this.remotePlayers[i].id === id) {
        return this.remotePlayers[i];
      }
    }
    return false;
  },

  resetCallbacks: [],
  reset: function() {
    _.map(Game.resetCallbacks, function(i,v) {
      Game.resetCallbacks[i].apply(this);
    });
  },

  winner: false
};

require('../entities')(Game);

require('./boot')(Game);
require('./preloader')(Game);
require('./mainmenu')(Game);
require('./play')(Game);
require('./game_over')(Game);

module.exports = Game;
},{"../entities":5,"./boot":15,"./game_over":16,"./mainmenu":18,"./play":19,"./preloader":20}],18:[function(require,module,exports){
/*
 * The MainMenu state is responsible for showing the
 * main menu of the game. 
 * 
 * The main menu has a scrolling background with two options
 * of new solo game or new multiplayer game. The difference
 * between the two is that `Game.multiplayer` is set to true
 * on the new mulitplayer option. 
 */
module.exports = (function(Game) {
  Game.States.MainMenu = function(game) {
    this.juicy;
    this.screenFlash;
  }

  Game.States.MainMenu.prototype = {
    create: function() {

      var game = this.game;

      this.startTime = game.time.now;
      
      var image = this.game.cache.getImage('logo'),
        centerX = this.world.centerX,
        centerY = this.world.centerY - image.height,
        endY    = this.world.height + image.height,
        textPadding = this.game.device.desktop ? 60 : 30;

      // Menu background
      this.background = game.add.tileSprite(0, 0, this.world.width, this.world.height, 'menu_background');
      this.background.autoScroll(-50, -20);
      this.background.tilePosition.x = 0;
      this.background.tilePosition.y = 0;

      // Add logo
      var sprite = game.add.sprite(centerX, centerY - textPadding, 'logo');
      sprite.anchor.set(0.5);

      if (this.game.device.desktop) {
        sprite.scale.set(2);
      }

      // Add new game
      var fontSize = (this.game.device.desktop ? '40px' : '20px');
      var newGame = this.newGame = this.add.text(this.world.centerX, 
        centerY + textPadding,
        "New game", 
        {
          font: fontSize + " Architects Daughter", 
          align:"center", 
          fill:"#fff"
        }); 
      newGame.inputEnabled = true;
      newGame.anchor.set(0.5);

      newGame.events.onInputOver.add(this.overNewgame, this);
      newGame.events.onInputOut.add(this.outNewgame, this);
      newGame.events.onInputDown.add(this.playGame, this);

      var multiGame = this.multiGame = 
        this.add.text(this.world.centerX, 
          centerY + textPadding + newGame.height,
        "New multiplayer game", 
        {
          font: fontSize + " Architects Daughter", 
          align:"center", 
          fill:"#fff"
        }); 
      multiGame.inputEnabled = true;
      multiGame.anchor.set(0.5);

      multiGame.events.onInputOver.add(this.overMultigame, this);
      multiGame.events.onInputOut.add(this.outMultigame, this);
      multiGame.events.onInputDown.add(this.playMultiGame, this);

      // Juicy
      this.juicy = game.plugins.add(Phaser.Plugin.Juicy);
      this.screenFlash = this.juicy.createScreenFlash();
      this.add.existing(this.screenFlash);

      // Music
      this.menu_music = game.add.audio('menu_music');
      this.dink       = game.add.audio('dink');
      this.menu_music.play();
    },

    playGame: function() {
      Game.multiplayer = false;
      this.menu_music.stop();
      this.game.state.start('Play');
    },

    playMultiGame: function() {
      Game.multiplayer = true;
      this.play();
    },

    overNewgame: function() {
      this.game.add.tween(this.newGame.scale)
        .to({x: 1.3, y: 1.3}, 300, Phaser.Easing.Exponential.Out, true)
      this.dink.play();
    },

    overMultigame: function() {
      this.game.add.tween(this.multiGame.scale)
        .to({x: 1.3, y: 1.3}, 300, Phaser.Easing.Exponential.Out, true)
      this.dink.play();
    },

    outMultigame: function() {
      this.game.add.tween(this.multiGame.scale)
        .to({x: 1, y: 1}, 300, Phaser.Easing.Exponential.Out, true)
      this.dink.play();
    },

    outNewgame: function() {
      this.game.add.tween(this.newGame.scale)
        .to({x: 1, y: 1}, 300, Phaser.Easing.Exponential.Out, true);
    }
  }
});

},{}],19:[function(require,module,exports){
module.exports = (function(Game) {
  var g = Game;
  Game.States.Play = function(game) {}

  Game.States.Play.prototype = {
    create: function() {
      var game = this.game;
      this.level      = Game.currentLevel || 0;
      this.levelData  = Game.Levels[this.level];
      this.points     = 0;

      // Background
      this.background = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'background' + this.level);
      this.background.autoScroll(1, 15);
      this.background.tilePosition.x = Game.backgroundX;
      this.background.tilePosition.y = Game.backgroundY;
      this.game.add.tween(this.background)
        .to({alpha: 0.3}, 
          5000, 
          Phaser.Easing.Linear.NONE, 
          true, 0, Number.POSITIVE_INFINITY, true);

      // FPS
      this.game.time.advancedTiming = true;
      this.fpsText = this.game.add.text(
          100, (this.game.height - 26), '', 
          { font: '16px Arial', fill: '#ffffff' }
      );

      // Enemy Lasers
      this.lasers         = game.add.group();
      // Enemies
      // this.enemies        = game.add.group();
      this.enemyGroups    = {}; //= game.add.group();
      this.enemyGroupsCount = 0;
      var levelEnemies = this.levelData.enemies;
      for (var i = 0; i <= levelEnemies.length; i++) {
        this.enemyGroups[i] = game.add.group();
        this.enemyGroupsCount++;
      };

      this.score = 0;
      // This player's bullets
      this.bullets        = game.add.group();
      // Other bullets
      this.remoteBullets  = game.add.group();
      // We have other players
      g.remotePlayers  = game.remotePlayers || [];

      // Setup shooting
      this.game.input.onDown.add(this.shootBullet, this);

      g.sio = g.socket;

      // We ALWAYS have us as a player
      g.hero = this.hero = new Game.Prefabs.Player(this.game, 
          this.game.width/2, 
          this.game.height + 60 + 20,
          this.game.input,
          true, g.sio);
      
      this.game.add.existing(this.hero);
      // this.game.add.tween(this.hero)
        // .to({
        //   y: this.game.height - (this.hero.height + 20)
        // }, 1500, Phaser.Easing.Exponential.Out, true);

      // Display lives
      this.livesGroup = this.game.add.group();
      this.livesGroup.add(this.game.add.sprite(0, 0, 'lives'));
      this.livesGroup.add(this.game.add.sprite(20, 3, 'num', 0));
      this.livesNum = this.game.add.sprite(35, 3, 'num', this.hero.lives+1);
      this.livesGroup.add(this.livesNum);
      this.livesGroup.x = this.game.width - 55;
      this.livesGroup.y = 5;
      this.livesGroup.alpha = 0;

      // Add bullets
      for(var i = 0; i<this.hero.numBullets; i++){
        var bullet = new Game.Prefabs.Bullet(this.game, 0, 0, this.hero);
        this.bullets.add(bullet);
      }

      // Score
      this.score = 0;
      this.scoreText = this.game.add.bitmapText(10, this.game.height - 27, 'architectsDaughter', 'Score: 0', 16);
      this.scoreText.alpha = 0;

      // Juicy
      this.juicy = this.game.plugins.add(Phaser.Plugin.Juicy);
      this.screenFlash = this.juicy.createScreenFlash();
      this.add.existing(this.screenFlash);
      
      this.game_music = game.add.audio('game_music');
      // this.game_music.play();

      // Enter play mode after init state
      this.timerInit = this.game.time.create(true);
      this.timerInit.add(Phaser.Timer.SECOND*1.5, this.initGame, this);
      this.timerInit.start();

      var gamePlay = this;
      var gamePlayer = _.extend(this.hero, {
        id: g.sid,
        name: 'You joined'
      })
      gamePlay.game.scope
          .$emit('game:newPlayer', gamePlayer);

      if (Game.multiplayer) {
        // Helpers
        var removePlayer = function(player, map) {
          g.remotePlayers.splice(g.remotePlayers.indexOf(player), 1);
          Game.toRemove.push(player);
          gamePlay.game.scope.$emit('game:removePlayer', {
            player: player,
            mapId: map
          });
        }

        // Handlers
        this.game.socket.on('gameUpdated:add', function(data) {
          console.log('gameUpdated:add');
          var allPlayers = data.allPlayers,
              newPlayers = [];
          
          for (var i = 0; i < allPlayers.length; i++) {
            var playerInQuestion = allPlayers[i];

            if (playerInQuestion.id === g.hero.id) {
              // Nope, we're already added
            } else if (Game.playerById(playerInQuestion.id)) {
              // Nope, we already know about 'em
            } else {
              g.toAdd.push(playerInQuestion);
              gamePlay.game.scope.$emit('game:newPlayer', playerInQuestion);
            }
          }
        });

        this.game.socket.on('gameUpdated:remove', function(data) {
          var allPlayers = g.remotePlayers,
              newPlayerList = data.allPlayers,
              newPlayers = [];

          var mapId = data.map;
          
          for (var i = 0; i < allPlayers.length; i++) {
            var playerInQuestion = allPlayers[i];

            if (playerInQuestion.id === g.hero.id) {
              // Nope, we're already added
            } else {
              var found = false;
              for (var i = 0; i < newPlayerList.length; i++) {
                if (newPlayerList[i].id === playerInQuestion.id) {
                  // The player is in the new player list
                  // so we don't have to remove them
                  found = true;
                }
              }
              if (!found) {
                // We can remove this player
                removePlayer(playerInQuestion, mapId);
              }
            }
          }
        });

        this.game.socket.on('updatePlayers', function(data) {
          var playersData = data.game.players;

          for (var i = 0; i < playersData.length; i++) {
            var playerData = playersData[i];
            var player;

            if (playerData.id !== g.sid) {
              player = Game.playerById(playerData.id);
              if (player) {
                player.onUpdateFromServer(playerData);
              }
            }

          }
        });

        this.game.socket.on('bulletShot', function(data) {
          var player = Game.playerById(data.id);

          if (player) {
            bullet = gamePlay.remoteBullets.getFirstExists(false);
            if(!bullet){
              bullet = new Game.Prefabs.Bullet(this.game, data.x, data.y, player);
              gamePlay.remoteBullets.add(bullet);
            }
            // Shoot the darn thing
            bullet.shoot();

            bullet.reset(data.x, data.y);
          }
        });

        this.game.socket.on('playerHit', function(data) {
          if (data.victim === g.sid) {
            // We were hit
            if (data.victimHealth === 0) {
              gamePlay.gameOver();
            }
          } else {
            var player = Game.playerById(data.victim);
            if (player) {
              if (data.victimHealth <= 0) {
                player.die();
              }
            }
          }
        });

        this.game.socket.on('gameOver', function(data) {
          var winnerId = data.winner.id;
          if (winnerId === g.sid) {
            // WE WON!
            Game.winner = true;
          } else {
            // We LOST :(
            Game.winner = false;
          }
          gamePlay.gameOver();
        });

        g.socket.emit('newPlayer', {
          mapId: Game.mapId,
          health: this.hero.health
        });
      }
    },

    update: function() {
      if(!Game.paused){
        // this.updatePlayer();

        this.addPlayers();
        this.removePlayers();
        // Run game loop thingy
        this.checkCollisions();

        this.fpsText.setText(this.game.time.fps + ' FPS');
      }
    },

    updateRemoteServer: function() {
      var game = this.game;

      g.socket.emit('updatePlayer', {
        x: this.hero.x,
        y: this.hero.y,
        xRel: this.hero.x / (Game.width === 0 ? 1 : Game.width),
        yRel: this.hero.y / (Game.height === 0 ? 1 : Game.height),
        health: this.hero.health,
        rotation: this.hero.rotation,
        timestamp: new Date().getTime()
      });

      this.updateRemoteServerTimer = this.game.time.events
        .add(
          20, // Every 100 miliseconds
          this.updateRemoteServer,
          this);
    },

    addPlayers: function() {
      while (g.toAdd.length !== 0) {
        var data = g.toAdd.shift();
        if (data) {
          var toAdd = 
            this.addPlayer(data.x, data.y, data.id);
          g.remotePlayers.push(toAdd);
        }
      }
    },

    addPlayer: function(x, y, id) {
      // We ALWAYS have us as a player
      var player = new Game.Prefabs.Player(this.game, this.game.width/2, 100, null, id);
      this.game.add.existing(player);

      return player;
    },

    removePlayers: function() {
      while (g.toRemove.length !== 0) {
        var toRemove = g.toRemove.shift();
        this.game.world.removeChild(toRemove, true);
      }
    },

    shutdown: function() {
      this.bullets.destroy();
      this.forEachEnemy(function(enemy) {
        enemy.destroy();
      });
      this.lasers.destroy();
      // this.updatePlayers.timer.pause();
      Game.paused = true;
    },

    goToMenu: function() {
      Game.backgroundX = this.background.tilePosition.x;
      Game.backgroundY = this.background.tilePosition.y;

      this.game.state.start('MainMenu');
    },

    initGame: function() {
        // Generate enemies
      // this.enemiesGenerator = this.game.time.events
        // .add(2000, this.generateEnemies, this);

      // Generate enemies laser
      // this.lasersGenerator = this.game.time.events
        // .add(1000, this.shootLaser, this);

      // Generate server updates
      this.updateRemoteServerTimer = this.game.time.events
        .add(200, this.updateRemoteServer, this);

      // Show UI
      // this.game.add.tween(this.livesGroup)
      //   .to({alpha:1}, 600, Phaser.Easing.Exponential.Out, true);
      // this.game.add.tween(this.scoreText)
      //   .to({alpha:1}, 600, Phaser.Easing.Exponential.Out, true);

      // Play
      this.playGame();
    },

    playGame: function() {
      if (Game.paused) {
        Game.paused = false;

        this.hero.follow = true;
        this.hero.body.collideWorldBounds = true;

        // NEED TO UPDATE THIS
        // this.enemiesGenerator.timer.resume();

        this.lasers.forEach(function(laser) {
          laser.resume();
        }, this);

        this.game.input.x = this.hero.x;
        this.game.input.y = this.hero.y;

      }
    },

    generateEnemies: function() {
      var levelEnemies = this.levelData.enemies;
      for (var i = 0; i < levelEnemies.length; i++) {

        var enemyGroup = this.enemyGroups[i],
            levelEnemy  = levelEnemies[i];
        var enemies = enemyGroup.getFirstExists(false);

        if(!enemies){
          enemies = new Game.Prefabs
            .Enemies(this.game, 
              levelEnemy.count || 10, 
              levelEnemy,
              this.hero,
              this.enemyGroups[i]);
        }
        // reset(fromY, toY, speed)
        enemies
          .reset(this.game.rnd.integerInRange(0, this.game.width), 
              this.game.rnd.integerInRange(0, this.game.width));
      }

      // Relaunch timer depending on level
      this.enemiesGenerator = this.game.time.events
        .add(
          this.game.rnd.integerInRange(20, 50) * 500/(this.level + 1), 
          this.generateEnemies, this);
    },

    shootBullet: function(){
      // Check delay time
      if(this.lastBulletShotAt === undefined) this.lastBulletShotAt = 0;
      if(this.game.time.now - this.lastBulletShotAt < this.hero.shotDelay){
        return;
      }
      this.lastBulletShotAt = this.game.time.now;

      // Create bullets
      var bullet, bulletPosY;
      bullet = this.bullets.getFirstExists(false);
      if(bullet) {

        bullet.reset(this.hero.x, this.hero.y);
        // Shoot the darn thing
        bullet.shoot();

        this.game.socket.emit('shotbullet', {
          id: g.sid,
          y: bullet.y,
          x: bullet.x,
          rotation: bullet.rotation
        });
      }
    },

    checkCollisions: function() {
      if (Game.multiplayer) {
        // g.remotePlayers.forEach(function(player) {
          this.game.physics.arcade.overlap(
              this.remoteBullets, 
              this.hero, this.killHero,
              null, this);

          g.remotePlayers.forEach(function(remotePlayer) {
            this.game.physics.arcade.overlap(
              this.bullets, remotePlayer, this.hitARemotePlayer, null, this);
          }, this);

        // }, this);
      } else {
        // Single player mode requires enemies
          var levelEnemies = this.enemyGroups;
          for (var i = 0; i < this.enemyGroupsCount; i++) {
            var enemies = levelEnemies[i];
            enemies.forEach(function(enemy) {
              this.game.physics.arcade.overlap(this.bullets, enemy, this.killEnemy, null, this);
            }, this);

            enemies.forEach(function(enemy) {
              this.game.physics.arcade.overlap(this.hero, enemy, this.killHero, null, this);
            }, this);
          }

          this.game.physics.arcade.overlap(this.hero, this.lasers, this.killHero, null, this);
          this.game.physics.arcade.overlap(this.hero, this.bonus, this.activeBonus, null, this);
        }
    },

    updateScore: function(enemy) {
      this.score += enemy.desc ? enemy.desc.maxHealth : 1;
      this.scoreText.setText('Score: ' + this.score + '');
    },

    killEnemy: function(bullet, enemy) {
      if (!enemy.dead && enemy.checkWorldBounds) {
        enemy.die();
        bullet.kill();
        this.updateScore(enemy);
      }
    },

    killHero: function(hero, enemy) {
      if(enemy instanceof Game.Prefabs.Laser || 
          (enemy instanceof Game.Prefabs.Enemy && 
            !enemy.dead && 
            enemy.checkWorldBounds)){
        this.hero.lives--;
        this.screenFlash.flash();

        if (this.hero.lives < 1) {
          this.gameOver();
        } else {
          this.hero.enableShield(2);
          this.game.add.tween(this.livesNum).to({alpha:0, y: 8}, 200, Phaser.Easing.Exponential.Out, true).onComplete.add(function(){
            this.livesNum.frame = this.hero.lives+1;
            this.livesNum.y = -2;
            this.game.add.tween(this.livesNum).to({alpha:1, y:3}, 200, Phaser.Easing.Exponential.Out, true);
          }, this);
        }

      } else if (enemy instanceof Game.Prefabs.Bullet) {
        
        var bullet = enemy,
            player = bullet.player;

        bullet.kill();

        if (this.hero.wasHitBy(bullet, player)) {
        // Shot by a player
          this.screenFlash.flash();

          // Notify server
          this.game.socket.emit('playerHit', {
            shooter: player.id,
            victim: g.sid,
            health: this.hero.health
          });
        }

        if (this.hero.health < 0) {
          this.gameOver();
        }

        // bullet.die();
      // } else {
        // enemy.die(true);
      }
    },

    hitARemotePlayer: function(player, bullet) {
      if (!player.shieldsEnabled) {
        player.showExplosion();
      }
      bullet.kill();
    },
    
    shootLaser: function(){
      var laser = this.lasers.getFirstExists(false);

      if(!laser){
        laser = new Game.Prefabs.Laser(this.game, 0, 0);
        this.lasers.add(laser);
      }
      laser.reset(
          this.game.width + laser.width/2, 
          this.game.rnd.integerInRange(20, this.game.height));
      laser.reload(100 + (this.level + 1)*30);

      // Relaunch bullet timer depending on level
      this.lasersGenerator = this.game.time.events
        .add(
          this.game.rnd.integerInRange(12, 20) * 250/(this.level + 1), 
          this.shootLaser, this);
    },

    gameOver: function() {
      // this.game.input.onDown.add(this.shootBullet, this);
      this.game.input.onDown.removeAll();

      this.gameover = true;

      this.juicy.shake(20, 5);

      this.game.add.tween(this.hero)
        .to({alpha: 0}, 500, Phaser.Easing.Exponential.Out, true);

      this.scoreText.alpha = 0;
      this.livesGroup.alpha = 0;

      this.pauseGame();

      // Clean up socket
      this.game.socket.removeAllListeners();

      // Show the gameover panel
      this.state.start('GameOver');
    },

    forEachEnemy: function(fn) {
      var levelEnemies = this.enemyGroups;
      for (var i = 0; i < this.enemyGroupsCount; i++) {
        var enemies = levelEnemies[i];
        enemies.forEach(fn, this);
      }
    },

    pauseGame: function() {
      if (!Game.paused) {
        Game.paused = true;
        this.hero.follow = false;

        if (Game.multiplayer) {}
        else {
          this.enemiesGenerator.timer.pause();

          this.forEachEnemy(function(group) {
            group.callAll('pause');
          });

          this.lasers.forEach(function(laser) {
            laser.pause();
          }, this);
        }

        if (!this.gameover) {
          // this.pausePanel.show();
        }
      }
    }
  }
});

},{}],20:[function(require,module,exports){
module.exports = (function(Game) {
  var g = Game;

  Game.States.Preloader = function (game) {
     this.asset = null;
     this.ready = false;

     WebFontConfig = {
        //  The Google Fonts we want to load (specify as many as you like in the array)
        google: {
          families: ['Revalia', 'Architects Daughter']
        }
    };
  };

  Game.States.Preloader.prototype = {

    preload: function () {
      this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
      this.asset = this.add.sprite(this.world.centerX, this.world.centerY, 'preloader');
      this.asset.anchor.setTo(0.5, 0.5);
      this.load.setPreloadSprite(this.asset);

      // Load the game levels
      var Levels = Game.Levels = this.game.cache.getJSON('levels');

      // Load level backgrounds
      for (var i in Levels) {
        var obj = Levels[i];
        this.load.image('background'+i, obj.background);
      }

      // Load fonts
      this.game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

      // Load menu
      this.load.image('logo', 'assets/logo.png');

      // Load player sprites
      this.load.image('hero', 'assets/player_blue.png');
      this.load.image('shield', 'assets/shield.png');
      this.load.image('player_green', 'assets/player_green.png');

      this.load.image('laser_red', 'assets/laser_red.png');
      this.load.image('laser_yellow', 'assets/laser_yellow.png');
      this.load.image('laser_orange', 'assets/laser_orange.png');
      this.load.image('laser_gray', 'assets/laser_gray.png');

      // Load enemies
      this.load.image('enemy_1', 'assets/enemy_1.png');
      this.load.image('enemy_2', 'assets/enemy_2.png');
      this.load.image('enemy_3', 'assets/enemy_3.png');

      // Next level and gameover graphics
      this.load.image('next_level', 'assets/levelcomplete-bg.png');
      this.load.image('gameover', 'assets/gameover-bg.png');
      this.load.image('new', 'assets/new.png');

      this.load.spritesheet('btnMenu', 'assets/btn-menu.png', 190, 49, 2);
      this.load.spritesheet('btn', 'assets/btn.png', 49, 49, 6);
      this.load.spritesheet('num', 'assets/num.png', 12, 11, 5);
      this.load.spritesheet('bonus', 'assets/bonus.png', 16, 16, 2);

      // Numbers
      this.load.image('num', 'assets/num.png');
      this.load.image('lives', 'assets/lives.png');
      this.load.image('panel', 'assets/panel.png');

      this.load.image('laser', 'assets/laser.png');
      this.load.image('bullet', 'assets/bullet.png');

      // Audio
      this.load.audio('laserFx', 'assets/laser_01.mp3');
      this.load.audio('dink', 'assets/dink.mp3');
      this.load.audio('menu_music', 'assets/menu_music.mp3');
      this.load.audio('game_music', 'assets/game_music.mp3');

      this.load.spritesheet('explosion', 'assets/explode.png', 128, 128, 16);

      // Fonts
      this.load.bitmapFont('architectsDaughter', 
        'assets/fonts/r.png', 
        'assets/fonts/r.fnt');

      // Finally, load the cached level, if there is one
      Game.currentLevel = 0;
      if (localStorage.getItem('currentLevel')) {
        Game.currentLevel = localStorage.getItem('currentLevel');
      }
    },

    create: function () {
      this.asset.cropEnabled = false;

      this.game.stage.backgroundColor = 0x2B3E42;
      var tween = this.add.tween(this.asset)
      .to({
        alpha: 0
      }, 500, Phaser.Easing.Linear.None, true);
      tween.onComplete.add(this.startMainMenu, this);

      // Load keyboard capture
      var game = this.game;
      Game.cursors = game.input.keyboard.createCursorKeys();
      // var music = this.game.add.audio('galaxy');
      // music.loop = true;
      // music.play('');
      // window.music = music;
    },

    startMainMenu: function() {
      if (!!this.ready) {
        if (Game.mapId) {
          this.game.state.start('Play');
        } else {
          this.game.state.start('MainMenu');
        }
        // this.game.state.start('Play');
        // this.game.state.start('NextLevel');
      }
    },

    toggleMusic: function() {
      if (this.musicIsPlaying = !this.musicIsPlaying) {
        music.stop();
      } else {
        music.play('');
      }
    },

    onLoadComplete: function () {
      this.ready = true;
    }
  };
});
},{}],21:[function(require,module,exports){

angular.module('app', [
  'ui.router',
  require('./menu').name,
  require('./game').name,
  require('./user').name,
  require('./navbar').name,
  require('./overlay').name,
  require('./network').name,
])
.config(function($urlRouterProvider) {
  $urlRouterProvider
    .otherwise('/menu');
})

},{"./game":11,"./menu":22,"./navbar":25,"./network":28,"./overlay":32,"./user":35}],22:[function(require,module,exports){
module.exports = 
angular.module('app.menu', [
  require('./play_button').name
])
.config(function($stateProvider) {
  $stateProvider
    .state('menu', {
      abstract: true,
      templateUrl: 'scripts/menu/template.html',
      url: '/menu'
    })
    .state('menu.home', {
      url: '',
      templateUrl: 'scripts/menu/main.html',
      controller: 'MenuController as ctrl',
      onEnter: function(Room) {
        Room.queryForRooms();
      }
    })
})

require('./menu_controller');
},{"./menu_controller":23,"./play_button":24}],23:[function(require,module,exports){
angular.module('app.menu')
.controller('MenuController', function(mySocket, $scope, Room) {

  $scope.$on('map:update', function(evt, mapId) {
    ctrl.rooms = Room.getRooms();
  });

  var ctrl = this;

  ctrl.createId = function() {
    return new Date().getTime().toString();
  };

});
},{}],24:[function(require,module,exports){
module.exports =
angular.module('app.menu.playButton', [])
.directive('playButton', function() {
  return {
    scope: {
      onClick: '&'
    },
    template: '<div class="playButton"\
        ng-click="onClick()">\
      <i class="icon ion-play"></i>\
      <span class="play-text">play</span>\
    </div>'
  }
})
},{}],25:[function(require,module,exports){
module.exports =
angular.module('app.navbar', [])
.directive('navbar', function() {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: 'scripts/navbar/navbar.html',
    controller: 'NavbarController'
  }
})

require('./navbar_controller');
},{"./navbar_controller":26}],26:[function(require,module,exports){
angular.module('app.navbar')
.controller('NavbarController', function($scope, Game, players) {

  $scope.connectedPlayers = [];
  $scope.game = Game;

  $scope.$on('newPlayers', function(evt, players) {
    $scope.connectedPlayers = players;
  });

})
},{}],27:[function(require,module,exports){
angular.module('app.network')
.factory('FeedItem', function() {
  var FeedItem = function(eventName, data) {
    this.id = data.id;
    this.eventName = eventName;

    this.msg = data.name || eventName + ' happened';
  };

  return FeedItem;
})
.service('feed', function(mySocket, $rootScope, FeedItem) {
  
  // $rootScope.$on('')
  var service = this,
      list = [];

  this.list = list;
  this.maxLength = 10;

  var addToList = function(name, data) {
    $rootScope.$apply(function() {
      var item = new FeedItem(name, data);
      list.unshift(item);

      if (list.length > service.maxLength) {
        list.splice(service.maxLength, list.length - service.maxLength);
      }
    });
  }

  $rootScope.$on('game:removePlayer', function(evt, playerData) {
  });

  mySocket.then(function(socket) {
    // New player joined
    socket.on('newPlayer', function(data) {
      addToList("join", data);
    });

    // Player was hit
    socket.on('playerHit', function(data) {
      addToList("playerHit", data);
    });

  });

});

},{}],28:[function(require,module,exports){
require('./ioLoader');

module.exports =
angular.module('app.network', [
  'btford.socket-io',
  'app.loader'
])
.config(function(ioLoaderProvider) {
  console.log('ioLoader', ioLoaderProvider);
})

require('./ws');
require('./players');
require('./feed');
},{"./feed":27,"./ioLoader":29,"./players":30,"./ws":31}],29:[function(require,module,exports){
'use strict';

angular.module('app.loader', [])
.provider('ioLoader', function() {

  this.scriptUrl = window.location.origin+'/socket.io/socket.io.js';

  this.$get = ['$window', '$document', '$q', function($window, $document, $q) {

    var defer = $q.defer(),
      scriptUrl = this.scriptUrl;

    return {

      done: function(){

        var onScriptLoad = function(){
          return defer.resolve($window.io);
        };

        if($window.io){
          onScriptLoad();
        }
        else{
          var scriptTag = $document[0].createElement('script');

          scriptTag.type = 'text/javascript';
          scriptTag.async = true;
          scriptTag.src = scriptUrl;
          scriptTag.onreadystatechange = function () {
            if (this.readyState === 'complete') {
              onScriptLoad();
            }else{
              defer.reject();
            }
          };
          scriptTag.onload = onScriptLoad;
          var s = $document[0].getElementsByTagName('head')[0];
          s.appendChild(scriptTag);
        }

        return defer.promise;
      }
    };
  }];

  this.setScriptUrl = function(url) {
    this.scriptUrl = url;
  };


});

},{}],30:[function(require,module,exports){
angular.module('app.network')
// The player model
// We'll store the player and their name
.factory('Player', function() {
  var Player = function(data) {
    this.id = data.id;
    this.name = data.name;
  };

  return Player;
})
// The `players` service holds all of the current players
// for the game. We use it to manage any player-related data
.service('players', function(mySocket, $rootScope, Player, Room) {
  
  var service = this,
      listOfPlayers = [];

  var playerById = function(id) {
    var player;
    for (var i = 0; i < listOfPlayers.length; i++) {
      if (listOfPlayers[i].id === id) {
        return listOfPlayers[i];
      }
    }
  }

  // Socket listeners
  mySocket.then(function(socket) {
    socket.on('gameOver', function(data) {
      $rootScope.$apply(function() {
        listOfPlayers = [];
      });
    });

    socket.on('map:update', function(map) {
      console.log('players map:update', map);
    })
  });

  // Scope listeners
  $rootScope.$on('game:removePlayer', function(evt, playerData) {
    var player = playerById(playerData.id);
    var idx = listOfPlayers.indexOf(player);

    console.log('game:removePlayer players player', playerData.id, _.map(listOfPlayers, 'id'));
    listOfPlayers.splice(idx, 1);
    $rootScope.$broadcast('newPlayers', listOfPlayers);
  });
  // Do we have a new player?
  $rootScope.$on('game:newPlayer', function(evt, playerData) {
    var player = new Player(playerData);
    listOfPlayers.push(player);
    $rootScope.$broadcast('newPlayers', listOfPlayers);
  });

});

},{}],31:[function(require,module,exports){
angular.module('app.network')
.factory('mySocket', function(ioLoader, $q, socketFactory, User) {

  var mySocket = $q.defer();

  ioLoader.done().then(function(io) {
    var myIoSocket = io.connect();

    var aSock = socketFactory({
      ioSocket: myIoSocket
    });

    mySocket.resolve(aSock);
  });

  return mySocket.promise;
});

},{}],32:[function(require,module,exports){
module.exports =
angular.module('app.overlay', [])
.directive('overlayBar', function() {
  return {
    templateUrl: '/scripts/overlay/overlay.html',
    controller: 'OverlayController as ctrl'
  }
})

require('./overlay_controller.js');
},{"./overlay_controller.js":33}],33:[function(require,module,exports){
angular.module('app.overlay')
.controller('OverlayController', function($rootScope, $scope, players, feed) {
  var ctrl = this;

  ctrl.turnOffMusic = function() {
    $rootScope.$broadcast('game:toggleMusic');
  };

  ctrl.title = "Feed";

  ctrl.feed = feed.list;
  ctrl.feedLimit = 10;

  $scope.$on('newPlayers', function(evt, players) {
    $scope.players = players;
  });

})
},{}],34:[function(require,module,exports){
angular.module('app.user')
.service('Game', function() {

  this.playing = false;

});
},{}],35:[function(require,module,exports){
module.exports =
angular.module('app.user', [])

require('./user_service');
require('./room_service');
require('./game_service');
},{"./game_service":34,"./room_service":36,"./user_service":37}],36:[function(require,module,exports){
angular.module('app.user')
.service('Room', function($rootScope, $q, mySocket) {
  var service = this;
  var currentRooms = [],
      currentRoomCount = 0;

  this.queryForRooms = function() {
    mySocket.then(function(socket) {
      socket.emit('getMaps');
    });
  };

  mySocket.then(function(socket) {
    socket.on('getAllMaps', function(data) {
      currentRooms = data;
      $rootScope.$broadcast('map:update');
    });

    socket.on('global:newPlayer', function(data) {
      var mapId = data.map,
          map   = getRoomById(mapId);

      if (map) {
        map.players.push(data.player);
      }
    });

    socket.on('newMapCreated', function(newMap) {
      currentRooms.push(newMap);
      $rootScope.$broadcast('map:update', newMap);
    });

    socket.on('gameOver', function(data) {
      var mapId = data.mapId,
          map   = getRoomById(mapId);

      console.log('gameOver', data, map);
    });

    socket.on('global:playerLeftMap', function(data) {
      var mapId = data.mapId,
          map   = getRoomById(mapId);

      if (map) {
        var idx = getPlayerIndexById(data.id, map);
        map.players.splice(idx, 1);
      }
      $rootScope.$broadcast('map:update', map);
    });

    socket.on('global:removeMap', function(data) {
      var mapId = data.mapId,
          map   = getRoomById(mapId);

      if (map) {
        service.queryForRooms();
      }
      $rootScope.$broadcast('map:update', map);
    });

  });

  this.getRooms = function() {
    return currentRooms;
  };

  this.getRoom = function(id) {
    return getRoomById(id);
  };

  var getRoomById = function(id) {
    for (var i = 0; i < currentRooms.length; i++) {
      if (currentRooms[i].id === id) {
        return currentRooms[i];
      }
    }
    return false;
  };

  var getPlayerIndexById = function(id, map) {
    for (var i = 0; i < map.players.length; i++) {
      var player = map.players[i];
      if (player.id === id) {
        return i;
      }
    }
  };

});
},{}],37:[function(require,module,exports){
angular.module('app.user')
.service('User', function() {

  var currentUser =
    localStorage.getItem('currentUser');

  if (currentUser) {
    currentUser = JSON.parse(currentUser);
  };

  this.setCurrentUser = function(u) {
    localStorage.setItem('currentUser', JSON.stringify(u));
    currentUser = u;
  };

  this.getCurrentUser = function() {
    return currentUser;
  };

  this.modifyCurrentUser = function(opts) {
    var u = this.getCurrentUser();

    if (u) {
      for (var opt in opts) {
        u[opt] = opts[opt];
      }
      this.setCurrentUser(u);
    } else {
      this.setCurrentUser(opts);
    }

    return currentUser;
  };

});
},{}]},{},[21])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxkZXZcXGdpdFxcbmctZ2FtZVxcY2xpZW50XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvZW50aXRpZXMvYnVsbGV0LmpzIiwiQzovZGV2L2dpdC9uZy1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL2VudGl0aWVzL2VuZW1pZXMuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvZW50aXRpZXMvZW5lbXkuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvZW50aXRpZXMvZ2FtZW92ZXJfcGFuZWwuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvZW50aXRpZXMvaW5kZXguanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvZW50aXRpZXMvbGFzZXIuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvZW50aXRpZXMvcGF1c2VfcGFuZWwuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvZW50aXRpZXMvcGxheWVyLmpzIiwiQzovZGV2L2dpdC9uZy1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL2dhbWVfY2FudmFzLmpzIiwiQzovZGV2L2dpdC9uZy1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL2dhbWVfY29udHJvbGxlci5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9pbmRleC5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9saWIvanVpY3kuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvbGliL3V1aWQuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvbWFpbi5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9zdGF0ZXMvYm9vdC5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9zdGF0ZXMvZ2FtZV9vdmVyLmpzIiwiQzovZGV2L2dpdC9uZy1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL3N0YXRlcy9pbmRleC5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9zdGF0ZXMvbWFpbm1lbnUuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvc3RhdGVzL3BsYXkuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvc3RhdGVzL3ByZWxvYWRlci5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvbWFpbi5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvbWVudS9pbmRleC5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvbWVudS9tZW51X2NvbnRyb2xsZXIuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL21lbnUvcGxheV9idXR0b24vaW5kZXguanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL25hdmJhci9pbmRleC5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvbmF2YmFyL25hdmJhcl9jb250cm9sbGVyLmpzIiwiQzovZGV2L2dpdC9uZy1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9uZXR3b3JrL2ZlZWQuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL25ldHdvcmsvaW5kZXguanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL25ldHdvcmsvaW9Mb2FkZXIuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL25ldHdvcmsvcGxheWVycy5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvbmV0d29yay93cy5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvb3ZlcmxheS9pbmRleC5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvb3ZlcmxheS9vdmVybGF5X2NvbnRyb2xsZXIuanMiLCJDOi9kZXYvZ2l0L25nLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL3VzZXIvZ2FtZV9zZXJ2aWNlLmpzIiwiQzovZGV2L2dpdC9uZy1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy91c2VyL2luZGV4LmpzIiwiQzovZGV2L2dpdC9uZy1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy91c2VyL3Jvb21fc2VydmljZS5qcyIsIkM6L2Rldi9naXQvbmctZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvdXNlci91c2VyX3NlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL2dCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMza0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oR2FtZSkge1xyXG5cclxuICBHYW1lLlByZWZhYnMuQnVsbGV0ID0gZnVuY3Rpb24oZ2FtZSwgeCwgeSwgcGxheWVyLCBoYW5kbGVLaWxsZWRGbil7XHJcbiAgICB0aGlzLkJVTExFVF9TUEVFRCA9IDUwMDtcclxuXHJcbiAgICB0aGlzLnBsYXllciA9IHBsYXllcjtcclxuICAgIHRoaXMuZ2FtZSA9IHBsYXllci5nYW1lO1xyXG5cclxuICAgIFBoYXNlci5TcHJpdGUuY2FsbCh0aGlzLCBwbGF5ZXIuZ2FtZSwgMCwgMCwgJ2J1bGxldCcpO1xyXG4gICAgXHJcbiAgICB0aGlzLmFuY2hvci5zZXRUbygwLjUsIDAuNSk7XHJcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5lbmFibGUodGhpcywgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcclxuXHJcbiAgICB0aGlzLmFuZ2xlID0gLU1hdGguUEkvMjtcclxuICAgIHRoaXMua2lsbCgpOyAvLyBzZXQgZGVhZCBhdCBmaXJzdFxyXG5cclxuICAgIHRoaXMubGFzZXJTb3VuZCA9IHRoaXMuZ2FtZS5hZGQuYXVkaW8oJ2xhc2VyRngnKTtcclxuXHJcbiAgICB0aGlzLmNoZWNrV29ybGRCb3VuZHMgPSB0cnVlO1xyXG4gICAgdGhpcy5vdXRPZkJvdW5kc0tpbGwgPSB0cnVlO1xyXG5cclxuICAgIC8vIHRoaXMuZXZlbnRzLm9uS2lsbGVkLmFkZCh0aGlzLmhhbmRsZUtpbGxlZCwgdGhpcyk7XHJcbiAgICBpZiAoaGFuZGxlS2lsbGVkRm4pIHtcclxuICAgICAgdGhpcy5ldmVudHMub25LaWxsZWQuYWRkKGhhbmRsZUtpbGxlZEZuLCB0aGlzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIEdhbWUuUHJlZmFicy5CdWxsZXQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuU3ByaXRlLnByb3RvdHlwZSk7XHJcbiAgR2FtZS5QcmVmYWJzLkJ1bGxldC5jb25zdHJ1Y3RvciA9IEdhbWUuUHJlZmFicy5CdWxsZXQ7XHJcblxyXG4gIEdhbWUuUHJlZmFicy5CdWxsZXQucHJvdG90eXBlLnNob290ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnJvdGF0aW9uID0gdGhpcy5wbGF5ZXIucm90YXRpb247XHJcblxyXG4gICAgLy8gdmFyIHB0ID0gdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIucG9zaXRpb247XHJcbiAgICAvLyBsYXNlci5hbmdsZSA9IHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5hbmdsZUJldHdlZW4obGFzZXIsIHB0KTtcclxuXHJcbiAgICB0aGlzLnhWZWwgPSBNYXRoLmNvcyh0aGlzLnJvdGF0aW9uKSAqIHRoaXMuQlVMTEVUX1NQRUVEO1xyXG4gICAgdGhpcy55VmVsID0gTWF0aC5zaW4odGhpcy5yb3RhdGlvbikgKiB0aGlzLkJVTExFVF9TUEVFRDtcclxuICAgIHRoaXMubGFzZXJTb3VuZC5wbGF5KCk7XHJcbiAgfTtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkJ1bGxldC5wcm90b3R5cGUuc2hvb3RGcm9tID0gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgdGhpcy5yb3RhdGlvbiA9IGRhdGEucm90YXRpb247XHJcblxyXG4gICAgdGhpcy54VmVsID0gTWF0aC5jb3ModGhpcy5yb3RhdGlvbikgKiB0aGlzLkJVTExFVF9TUEVFRDtcclxuICAgIHRoaXMueVZlbCA9IE1hdGguc2luKHRoaXMucm90YXRpb24pICogdGhpcy5CVUxMRVRfU1BFRUQ7XHJcbiAgfTtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkJ1bGxldC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgbGFzZXIgPSB0aGlzO1xyXG4gICAgbGFzZXIuYm9keS52ZWxvY2l0eS54ID0gdGhpcy54VmVsO1xyXG4gICAgbGFzZXIuYm9keS52ZWxvY2l0eS55ID0gdGhpcy55VmVsO1xyXG4gIH1cclxuXHJcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKEdhbWUpIHtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkVuZW1pZXMgPSBmdW5jdGlvbihnYW1lLCBjb3VudCwgZW5lbXlEZXNjLCBoZXJvLCBwYXJlbnQpIHtcclxuICAgIHZhciBkZXNjID0gdGhpcy5kZXNjID0gZW5lbXlEZXNjO1xyXG5cclxuICAgIC8vIExvYWRpbmdcclxuICAgIFBoYXNlci5Hcm91cC5jYWxsKHRoaXMsIGdhbWUsIHBhcmVudCk7XHJcblxyXG4gICAgdGhpcy5jb3VudCA9IGNvdW50ID0gY291bnQgfHwgNTtcclxuXHJcbiAgICB0aGlzLmxpdmluZ0VuZW1pZXMgPSBjb3VudDtcclxuXHJcbiAgICB0aGlzLmtpbGxlZEFsbCA9IHRydWU7XHJcblxyXG4gICAgdmFyIGVuZW15LFxyXG4gICAgICAgIHBhZGRpbmcgPSAxMDtcclxuICAgIC8vIE5vdCBzdXJlIHdoeSB0aGVyZSBpcyBhIGJ1ZyBoZXJlLi4uIGJhaFxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgIGVuZW15ID0gdGhpcy5hZGQoXHJcbiAgICAgICAgbmV3IEdhbWUuUHJlZmFicy5FbmVteSh0aGlzLmdhbWUsIDAsIDAsIGRlc2MsIGVuZW15IHx8IGhlcm8pXHJcbiAgICAgICk7XHJcbiAgICAgIGVuZW15LnggPSBlbmVteSA/IGVuZW15LnggOiB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKGVuZW15LndpZHRoLCBnYW1lLndpZHRoIC0gZW5lbXkud2lkdGgpO1xyXG4gICAgICBlbmVteS55ID0gLSh0aGlzLmdhbWUuaGVpZ2h0ICsgZW5lbXkuaGVpZ2h0LzIgKyBpICogKGVuZW15LmhlaWdodCkpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIEdhbWUuUHJlZmFicy5FbmVtaWVzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLkdyb3VwLnByb3RvdHlwZSk7XHJcbiAgR2FtZS5QcmVmYWJzLkVuZW1pZXMuY29uc3RydWN0b3IgPSBHYW1lLlByZWZhYnMuRW5lbWllcztcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkVuZW1pZXMucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5jYWxsQWxsKCd1cGRhdGUnKTtcclxuICB9O1xyXG5cclxuICBHYW1lLlByZWZhYnMuRW5lbWllcy5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbihmcm9tLCB0bywgc3BlZWQpIHtcclxuICAgIHRoaXMuZXhpc3RzID0gdHJ1ZTtcclxuICAgIHRoaXMubGl2aW5nRW5lbWllcyA9IHRoaXMuY291bnQ7XHJcbiAgICB0aGlzLmtpbGxlZEFsbCA9IHRydWU7XHJcblxyXG4gICAgdmFyIGkgPSAwO1xyXG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGVuZW15KSB7XHJcbiAgICAgIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgZW5lbXkucmVzZXRUYXJnZXQodG8pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBlbmVteS5yZWxvYWQoaSwgZnJvbSwgc3BlZWQpO1xyXG4gICAgICBpKys7XHJcbiAgICB9LCB0aGlzKTtcclxuICB9O1xyXG5cclxuICBHYW1lLlByZWZhYnMuRW5lbWllcy5wcm90b3R5cGUudXBkYXRlU3RhdHVzID0gZnVuY3Rpb24oZW5lbXksIGF1dG9LaWxsKXtcclxuICAgIHRoaXMubGl2aW5nRW5lbWllcy0tO1xyXG5cclxuICAgIGlmKGF1dG9LaWxsKXtcclxuICAgICAgdGhpcy5raWxsZWRBbGwgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLmxpdmluZ0VuZW1pZXMgPT09IDApe1xyXG4gICAgICB0aGlzLmV4aXN0cyA9IGZhbHNlO1xyXG5cclxuICAgICAgLy8gUmFuZG9tbHkgYWN0aXZhdGUgYSBib251cyBpZiBraWxsZWQgYWxsIHRoZSBlbmVtaWVzXHJcbiAgICAgIGlmKHRoaXMua2lsbGVkQWxsKXtcclxuICAgICAgICB2YXIgcmRtID0gdGhpcy5nYW1lLnJuZC5pbnRlZ2VySW5SYW5nZSgxLCB0aGlzLmNvdW50KTtcclxuICAgICAgICBcclxuICAgICAgICBpZihyZG0gPT09IDEpIHtcclxuICAgICAgICAgIHRoaXMuZ2FtZS5zdGF0ZS5nZXRDdXJyZW50U3RhdGUoKS5hZGRCb251cyhlbmVteSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKEdhbWUpIHtcclxuICBHYW1lLlByZWZhYnMuRW5lbXkgPSBmdW5jdGlvbihnYW1lLCB4LCB5LCBkZXNjLCB0YXJnZXQpe1xyXG4gICAgdmFyIGRlc2MgPSB0aGlzLmRlc2MgPSBkZXNjO1xyXG5cclxuICAgIHZhciB0eXBlID0gJ2VuZW15XycgKyBkZXNjLnR5cGUgfHwgJzEnO1xyXG4gICAgLy8gU3VwZXIgY2FsbCB0byBQaGFzZXIuc3ByaXRlXHJcbiAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgeCwgeSwgdHlwZSk7XHJcblxyXG4gICAgLy8gU3BlZWRcclxuICAgIHRoaXMuc3BlZWQgPSBkZXNjLnNwZWVkO1xyXG5cclxuICAgIC8vIFRhcmdldFxyXG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XHJcblxyXG4gICAgLy8gRGVhZCAtIENhbid0IHVzZSBhbGl2ZSBiZWNhdXNlIGVuZW1pZXMgZm9sbG93IGVhY2ggb3RoZXJcclxuICAgIHRoaXMuZGVhZCA9IGZhbHNlO1xyXG5cclxuICAgIC8vIE1pbiBEaXN0YW5jZVxyXG4gICAgdGhpcy5taW5EaXN0YW5jZSA9IDEwO1xyXG5cclxuICAgIC8vIEV4cGxvc2lvblxyXG4gICAgdGhpcy5leHBsb3Npb24gPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSgwLDAsICdleHBsb3Npb24nKTtcclxuICAgIHRoaXMuZXhwbG9zaW9uLmFuY2hvci5zZXRUbygwLjUsIDAuNSk7XHJcbiAgICB0aGlzLmV4cGxvc2lvbi5hbHBoYSA9IDA7XHJcblxyXG4gICAgLy8gRW5hYmxlIHBoeXNpY3Mgb24gdGhpcyBvYmplY3RcclxuICAgIHRoaXMuYW5jaG9yLnNldFRvKDAuNSwgMC41KTtcclxuICAgICAgdGhpcy5nYW1lLnBoeXNpY3MuZW5hYmxlKHRoaXMsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XHJcblxyXG4gICAgICAvLyBPdXQgb2YgYm91bmRzIGNhbGxiYWNrXHJcbiAgICAgIHRoaXMuZXZlbnRzLm9uT3V0T2ZCb3VuZHMuYWRkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdGhpcy5kaWUodHJ1ZSk7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgR2FtZS5QcmVmYWJzLkVuZW15LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xyXG4gIEdhbWUuUHJlZmFicy5FbmVteS5jb25zdHJ1Y3RvciA9IEdhbWUuUHJlZmFicy5FbmVteTtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkVuZW15LnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYoIUdhbWUucGF1c2VkKXtcclxuICAgICAgLy8gQ2hhbmdlIHZlbG9jaXR5IHRvIGZvbGxvdyB0aGUgdGFyZ2V0XHJcbiAgICAgIHZhciBkaXN0YW5jZSwgcm90YXRpb247XHJcbiAgICAgIGRpc3RhbmNlID0gdGhpcy5nYW1lLm1hdGguZGlzdGFuY2UodGhpcy54LCB0aGlzLnksIFxyXG4gICAgICAgIHRoaXMudGFyZ2V0LngsIFxyXG4gICAgICAgIHRoaXMudGFyZ2V0LnkpO1xyXG5cclxuICAgICAgaWYgKGRpc3RhbmNlID4gdGhpcy5taW5EaXN0YW5jZSkge1xyXG4gICAgICAgIHJvdGF0aW9uID0gdGhpcy5nYW1lLm1hdGguYW5nbGVCZXR3ZWVuKHRoaXMueCwgdGhpcy55LCB0aGlzLnRhcmdldC54LCB0aGlzLnRhcmdldC55KTtcclxuXHJcbiAgICAgICAgdGhpcy5ib2R5LnZlbG9jaXR5LnggPSBNYXRoLmNvcyhyb3RhdGlvbikgKiB0aGlzLnNwZWVkO1xyXG4gICAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS55ID0gLShNYXRoLnNpbihyb3RhdGlvbikgKiB0aGlzLnNwZWVkKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmJvZHkudmVsb2NpdHkuc2V0VG8oMCwgMCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFjdGl2ZSBlbmVteVxyXG4gICAgICBpZih0aGlzLnkgPCB0aGlzLmdhbWUuaGVpZ2h0ICYmICF0aGlzLmNoZWNrV29ybGRCb3VuZHMpIHtcclxuICAgICAgICB0aGlzLmNoZWNrV29ybGRCb3VuZHMgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkVuZW15LnByb3RvdHlwZS5kaWUgPSBmdW5jdGlvbihhdXRvS2lsbCl7XHJcbiAgICBpZighdGhpcy5kZWFkKXtcclxuICAgICAgdGhpcy5kZWFkID0gdHJ1ZTtcclxuICAgICAgdGhpcy5hbHBoYSA9IDA7XHJcblxyXG4gICAgICAvLyBFeHBsb3Npb25cclxuICAgICAgaWYoIWF1dG9LaWxsKXtcclxuICAgICAgICB0aGlzLmV4cGxvc2lvbi5yZXNldCh0aGlzLngsIHRoaXMueSk7XHJcbiAgICAgICAgdGhpcy5leHBsb3Npb24uYW5nbGUgPSB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKDAsIDM2MCk7XHJcbiAgICAgICAgdGhpcy5leHBsb3Npb24uYWxwaGEgPSAwO1xyXG4gICAgICAgIHRoaXMuZXhwbG9zaW9uLnNjYWxlLnggPSAwLjI7XHJcbiAgICAgICAgdGhpcy5leHBsb3Npb24uc2NhbGUueSA9IDAuMjtcclxuICAgICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMuZXhwbG9zaW9uKVxyXG4gICAgICAgICAgLnRvKHthbHBoYTogMSwgYW5nbGU6IFwiKzMwXCJ9LCAyMDAsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5PTkUsIHRydWUsIDApLnRvKHthbHBoYTogMCwgYW5nbGU6IFwiKzMwXCJ9LCAzMDAsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5PTkUsIHRydWUsIDApO1xyXG4gICAgICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5leHBsb3Npb24uc2NhbGUpXHJcbiAgICAgICAgICAudG8oe3g6MS41LCB5OjEuNX0sIDUwMCwgUGhhc2VyLkVhc2luZy5DdWJpYy5PdXQsIHRydWUsIDApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBVcGRhdGUgcGFyZW50IGdyb3VwXHJcbiAgICAgIHRoaXMucGFyZW50LnVwZGF0ZVN0YXR1cyh0aGlzLCBhdXRvS2lsbCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkVuZW15LnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmJvZHkudmVsb2NpdHkueCA9IDA7XHJcbiAgICB0aGlzLmJvZHkudmVsb2NpdHkueSA9IDA7XHJcbiAgfTtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkVuZW15LnByb3RvdHlwZS5yZWxvYWQgPSBmdW5jdGlvbihpLCBmcm9tKXtcclxuICAgIC8vIHRoaXMueCA9IHRoaXMuZ2FtZS53aWR0aCArIHRoaXMud2lkdGgvMiArIGkqKHRoaXMud2lkdGggKyAxMCk7XHJcbiAgICB0aGlzLnggPSBmcm9tO1xyXG4gICAgdGhpcy5jaGVja1dvcmxkQm91bmRzID0gZmFsc2U7XHJcbiAgICB0aGlzLmRlYWQgPSBmYWxzZTtcclxuICAgIHRoaXMuYWxwaGEgPSAxO1xyXG4gICAgdGhpcy55ID0gLXRoaXMuaGVpZ2h0ICsgaSoodGhpcy5oZWlnaHQpOyAvL3RoaXMuZ2FtZS5oZWlnaHQgKyB0aGlzLmhlaWdodC8yICsgaSoodGhpcy5oZWlnaHQgKyAxMCk7IC8vZnJvbTtcclxuICB9O1xyXG5cclxuICBHYW1lLlByZWZhYnMuRW5lbXkucHJvdG90eXBlLnJlc2V0VGFyZ2V0ID0gZnVuY3Rpb24odG8pe1xyXG4gICAgdGhpcy50YXJnZXQgPSBuZXcgUGhhc2VyLlBvaW50KHRoaXMueCB8fCB0aGlzLmdhbWUud2lkdGgvMiwgdG8pO1xyXG4gIH07XHJcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKEdhbWUpIHtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkdhbWVvdmVyUGFuZWwgPSBmdW5jdGlvbihnYW1lLCBwYXJlbnQpe1xyXG4gICAgLy8gU3VwZXIgY2FsbCB0byBQaGFzZXIuR3JvdXBcclxuICAgIFBoYXNlci5Hcm91cC5jYWxsKHRoaXMsIGdhbWUsIHBhcmVudCk7XHJcblxyXG4gICAgLy8gQWRkIHBhbmVsXHJcbiAgICB0aGlzLnBhbmVsID0gdGhpcy5nYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3BhbmVsJyk7XHJcbiAgICB0aGlzLnBhbmVsLndpZHRoID0gdGhpcy5nYW1lLndpZHRoLzI7XHJcbiAgICB0aGlzLnBhbmVsLmhlaWdodCA9IDE1MDtcclxuICAgIHRoaXMuYWRkKHRoaXMucGFuZWwpO1xyXG5cclxuICAgIC8vIFBhdXNlIHRleHRcclxuICAgIHZhciBoZWFkZXJUZXh0ID0gR2FtZS53aW5uZXIgPyBcIllvdSB3b24hXCIgOiBcIllvdSBsb3N0IDooXCI7XHJcblxyXG4gICAgdGhpcy50ZXh0UGF1c2UgPSB0aGlzLmdhbWUuYWRkXHJcbiAgICAgIC5iaXRtYXBUZXh0KGdhbWUud2lkdGgvMiwgLTUwLCAnYXJjaGl0ZWN0c0RhdWdodGVyJywgaGVhZGVyVGV4dCwgMjgpO1xyXG4gICAgdGhpcy50ZXh0UGF1c2UucG9zaXRpb24ueCA9IFxyXG4gICAgICB0aGlzLmdhbWUud2lkdGgvMiAtIHRoaXMudGV4dFBhdXNlLnRleHRXaWR0aC8yO1xyXG4gICAgdGhpcy5hZGQodGhpcy50ZXh0UGF1c2UpO1xyXG5cclxuICAgIC8vIFNjb3JlIHRleHRcclxuICAgIHRoaXMudGV4dFNjb3JlID0gdGhpcy5nYW1lLmFkZFxyXG4gICAgICAuYml0bWFwVGV4dChnYW1lLndpZHRoLzIsIDgwLCAnYXJjaGl0ZWN0c0RhdWdodGVyJywgJ1Njb3JlIDogMCcsIDIyKTtcclxuICAgIHRoaXMudGV4dFNjb3JlLnBvc2l0aW9uLnggPSB0aGlzLmdhbWUud2lkdGgvMiAtIHRoaXMudGV4dFNjb3JlLnRleHRXaWR0aC8yO1xyXG4gICAgdGhpcy5hZGQodGhpcy50ZXh0U2NvcmUpO1xyXG5cclxuICAgIC8vIEhpZ2hzY29yZSB0ZXh0XHJcbiAgICB0aGlzLnRleHRIaWdoU2NvcmUgPSB0aGlzLmdhbWUuYWRkXHJcbiAgICAgIC5iaXRtYXBUZXh0KGdhbWUud2lkdGgvMiwgMTA1LCAnYXJjaGl0ZWN0c0RhdWdodGVyJywgJ0hpZ2ggU2NvcmUgOiAwJywgMjIpO1xyXG4gICAgdGhpcy50ZXh0SGlnaFNjb3JlLnBvc2l0aW9uLnggPSB0aGlzLmdhbWUud2lkdGgvMiAtIHRoaXMudGV4dEhpZ2hTY29yZS50ZXh0V2lkdGgvMjtcclxuICAgIHRoaXMuYWRkKHRoaXMudGV4dEhpZ2hTY29yZSk7XHJcblxyXG4gICAgLy8gR3JvdXAgcG9zXHJcbiAgICB0aGlzLnkgPSAtODA7XHJcbiAgICB0aGlzLnggPSAwO1xyXG4gICAgdGhpcy5hbHBoYSA9IDA7XHJcblxyXG4gICAgLy8gUGxheSBidXR0b25cclxuICAgIHRoaXMuYnRuUmVwbGF5ID0gdGhpcy5nYW1lLmFkZC5idXR0b24odGhpcy5nYW1lLndpZHRoLzItMzIsIDE1LCAnYnRuJywgdGhpcy5yZXBsYXksIHRoaXMsIDMsIDIsIDMsIDIpO1xyXG4gICAgdGhpcy5idG5SZXBsYXkuYW5jaG9yLnNldFRvKDAuNSwgMCk7XHJcbiAgICB0aGlzLmFkZCh0aGlzLmJ0blJlcGxheSk7XHJcblxyXG4gICAgLy8gQnRuIE1lbnVcclxuICAgIHRoaXMuYnRuTWVudSA9IHRoaXMuZ2FtZS5hZGQuYnV0dG9uKHRoaXMuZ2FtZS53aWR0aC8yKzI4LCAxNSwgJ2J0bicsIGZ1bmN0aW9uKCl7XHJcbiAgICAgIHRoaXMuZ2FtZS5zdGF0ZS5nZXRDdXJyZW50U3RhdGUoKS5nb1RvTWVudSgpO1xyXG4gICAgfSwgdGhpcywgNSwgNCwgNSwgNCk7XHJcbiAgICB0aGlzLmJ0bk1lbnUuYW5jaG9yLnNldFRvKDAuNSwgMCk7XHJcbiAgICB0aGlzLmFkZCh0aGlzLmJ0bk1lbnUpO1xyXG4gIH07XHJcblxyXG4gIEdhbWUuUHJlZmFicy5HYW1lb3ZlclBhbmVsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLkdyb3VwLnByb3RvdHlwZSk7XHJcbiAgR2FtZS5QcmVmYWJzLkdhbWVvdmVyUGFuZWwuY29uc3RydWN0b3IgPSBHYW1lLlByZWZhYnMuR2FtZW92ZXJQYW5lbDtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkdhbWVvdmVyUGFuZWwucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbihzY29yZSl7XHJcbiAgICBzY29yZSA9IHNjb3JlIHx8IDA7XHJcblxyXG4gICAgdmFyIGhpZ2hTY29yZTtcclxuICAgIHZhciBiZWF0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnd2lubmVyJywgR2FtZS53aW5uZXIpO1xyXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2hpZ2hTY29yZScsIDApO1xyXG5cclxuICAgIGlmKCEhbG9jYWxTdG9yYWdlKXtcclxuICAgICAgaGlnaFNjb3JlID0gcGFyc2VJbnQobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2hpZ2hTY29yZScpLCAxMCk7XHJcblxyXG4gICAgICBpZighaGlnaFNjb3JlIHx8IGhpZ2hTY29yZSA8IHNjb3JlKXtcclxuICAgICAgICBoaWdoU2NvcmUgPSBzY29yZTtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaGlnaFNjb3JlJywgaGlnaFNjb3JlLnRvU3RyaW5nKCkpO1xyXG5cclxuICAgICAgICAvLyBBZGQgbmV3IHNwcml0ZSBpZiBiZXN0IHNjb3JlIGJlYXRlZFxyXG4gICAgICAgIGlmKHNjb3JlID4gMCl7XHJcbiAgICAgICAgICBiZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgdGhpcy5uZXdTY29yZSA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDAsIDEyMCwgJ25ldycpO1xyXG4gICAgICAgICAgdGhpcy5uZXdTY29yZS5hbmNob3Iuc2V0VG8oMC41LCAwLjUpO1xyXG4gICAgICAgICAgdGhpcy5hZGQodGhpcy5uZXdTY29yZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoaWdoU2NvcmUgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudGV4dEhpZ2hTY29yZS5zZXRUZXh0KCdIaWdoIFNjb3JlOiAnICsgaGlnaFNjb3JlLnRvU3RyaW5nKCkpO1xyXG5cclxuICAgIC8vIENlbnRlciB0ZXh0XHJcbiAgICB2YXIgc2NvcmVUZXh0ID0gJ1Njb3JlOiAnICsgc2NvcmUudG9TdHJpbmcoKTtcclxuICAgIHRoaXMudGV4dFNjb3JlLnNldFRleHQoc2NvcmVUZXh0KTtcclxuXHJcbiAgICB0aGlzLnRleHRTY29yZS51cGRhdGUoKTtcclxuICAgIHRoaXMudGV4dFNjb3JlLnBvc2l0aW9uLnggPSB0aGlzLmdhbWUud2lkdGgvMiAtIHRoaXMudGV4dFNjb3JlLnRleHRXaWR0aC8yO1xyXG5cclxuICAgIHRoaXMudGV4dEhpZ2hTY29yZS51cGRhdGUoKTtcclxuICAgIHRoaXMudGV4dEhpZ2hTY29yZS5wb3NpdGlvbi54ID0gdGhpcy5nYW1lLndpZHRoLzIgLSB0aGlzLnRleHRIaWdoU2NvcmUudGV4dFdpZHRoLzI7XHJcblxyXG4gICAgdGhpcy5wYW5lbC5wb3NpdGlvbi54ID0gdGhpcy5nYW1lLndpZHRoLzIgIC0gdGhpcy5wYW5lbC53aWR0aC8yO1xyXG5cclxuICAgIGlmKGJlYXRlZCl7XHJcbiAgICAgIHRoaXMubmV3U2NvcmUueCA9IHRoaXMudGV4dEhpZ2hTY29yZS5wb3NpdGlvbi54IC0gMzA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2hvdyBwYW5lbFxyXG4gICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzKVxyXG4gICAgICAudG8oe1xyXG4gICAgICAgICAgYWxwaGE6MSwgXHJcbiAgICAgICAgICB5OnRoaXMuZ2FtZS5oZWlnaHQvMiAtIHRoaXMucGFuZWwuaGVpZ2h0LzJ9LCBcclxuICAgICAgICAxMDAwLCBcclxuICAgICAgICBQaGFzZXIuRWFzaW5nLkV4cG9uZW50aWFsLk91dCwgdHJ1ZSwgMCk7XHJcbiAgfTtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkdhbWVvdmVyUGFuZWwucHJvdG90eXBlLnJlcGxheSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAvLyBTdGFydFxyXG4gICAgR2FtZS5yZXNldCgpO1xyXG4gICAgR2FtZS5tdWx0aXBsYXllciA9IHRydWU7IC8vIEhhcmRjb2RlZCBmb3IgZGVtb1xyXG4gICAgdGhpcy5nYW1lLnN0YXRlLnN0YXJ0KCdQbGF5Jyk7XHJcbiAgfTtcclxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oR2FtZSkge1xyXG5cclxuICByZXF1aXJlKCcuL3BsYXllcicpKEdhbWUpO1xyXG4gIHJlcXVpcmUoJy4vZ2FtZW92ZXJfcGFuZWwnKShHYW1lKTtcclxuICByZXF1aXJlKCcuL3BhdXNlX3BhbmVsJykoR2FtZSk7XHJcblxyXG4gIHJlcXVpcmUoJy4vZW5lbWllcycpKEdhbWUpO1xyXG4gIHJlcXVpcmUoJy4vZW5lbXknKShHYW1lKTtcclxuXHJcbiAgcmVxdWlyZSgnLi9sYXNlcicpKEdhbWUpO1xyXG4gIHJlcXVpcmUoJy4vYnVsbGV0JykoR2FtZSk7XHJcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKEdhbWUpIHtcclxuICBHYW1lLlByZWZhYnMuTGFzZXIgPSBmdW5jdGlvbihnYW1lLCB4LCB5KXtcclxuICAgIC8vIFN1cGVyIGNhbGwgdG8gUGhhc2VyLnNwcml0ZVxyXG4gICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIHgsIHksICdsYXNlcicpO1xyXG5cclxuICAgIC8vIENlbnRlcmVkIGFuY2hvclxyXG4gICAgdGhpcy5hbmNob3Iuc2V0VG8oMC41LCAwLjUpO1xyXG5cclxuICAgIC8vIFNwZWVkXHJcbiAgICB0aGlzLnNwZWVkID0gMTUwO1xyXG5cclxuICAgIC8vIEtpbGwgd2hlbiBvdXQgb2Ygd29ybGRcclxuICAgIHRoaXMuY2hlY2tXb3JsZEJvdW5kcyA9IHRydWU7XHJcbiAgICB0aGlzLm91dE9mQm91bmRzS2lsbCA9IHRydWU7XHJcblxyXG4gICAgLy8gRW5hYmxlIHBoeXNpY3NcclxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xyXG5cclxuICAgIHRoaXMudHdlZW4gPSB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMpLnRvKHthbmdsZTotMzYwfSwgMzAwMCwgUGhhc2VyLkVhc2luZy5MaW5lYXIuTk9ORSwgdHJ1ZSwgMCwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZKTtcclxuICB9XHJcblxyXG4gIEdhbWUuUHJlZmFicy5MYXNlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcclxuICBHYW1lLlByZWZhYnMuTGFzZXIuY29uc3RydWN0b3IgPSBHYW1lLlByZWZhYnMuTGFzZXI7XHJcblxyXG4gIEdhbWUuUHJlZmFicy5MYXNlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKXtcclxuICAgIGlmKCFHYW1lLnBhdXNlZCl7XHJcbiAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS54ID0gLXRoaXMuc3BlZWQ7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5ib2R5LnZlbG9jaXR5LnggPSAwO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIEdhbWUuUHJlZmFicy5MYXNlci5wcm90b3R5cGUucmVsb2FkID0gZnVuY3Rpb24oc3BlZWQpe1xyXG4gICAgdGhpcy5hbHBoYSA9IDE7XHJcbiAgICB0aGlzLnNwZWVkID0gc3BlZWQ7XHJcbiAgICB0aGlzLnNjYWxlLnggPSAxO1xyXG4gICAgdGhpcy5zY2FsZS55ID0gMTtcclxuICB9O1xyXG5cclxuICBHYW1lLlByZWZhYnMuTGFzZXIucHJvdG90eXBlLmRpZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMpLnRvKHthbHBoYTogMH0sIDE1MCwgUGhhc2VyLkVhc2luZy5DdWJpYy5PdXQsIHRydWUsIDApO1xyXG4gICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLnNjYWxlKS50byh7eDoxLjUsIHk6MS41fSwgMTUwLCBQaGFzZXIuRWFzaW5nLkN1YmljLk91dCwgdHJ1ZSwgMCk7XHJcbiAgfTtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkxhc2VyLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnR3ZWVuLnBhdXNlKCk7XHJcbiAgfTtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLkxhc2VyLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy50d2Vlbi5yZXN1bWUoKTtcclxuICB9O1xyXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XHJcblxyXG4gIEdhbWUuUHJlZmFicy5QYXVzZVBhbmVsID0gZnVuY3Rpb24oZ2FtZSwgcGFyZW50KXtcclxuICAgIC8vIFN1cGVyIGNhbGwgdG8gUGhhc2VyLkdyb3VwXHJcbiAgICBQaGFzZXIuR3JvdXAuY2FsbCh0aGlzLCBnYW1lLCBwYXJlbnQpO1xyXG5cclxuICAgIC8vIEFkZCBwYW5lbFxyXG4gICAgdGhpcy5wYW5lbCA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdwYW5lbCcpO1xyXG4gICAgdGhpcy5wYW5lbC53aWR0aCA9IDQ4MDtcclxuICAgIHRoaXMucGFuZWwuaGVpZ2h0ID0gODA7XHJcbiAgICB0aGlzLmFkZCh0aGlzLnBhbmVsKTtcclxuXHJcbiAgICAvLyBQYXVzZSB0ZXh0XHJcbiAgICB0aGlzLnRleHRQYXVzZSA9IHRoaXMuZ2FtZS5hZGQuYml0bWFwVGV4dChnYW1lLndpZHRoLzIsIC00MiwgJ2tlbnBpeGVsYmxvY2tzJywgJ1BhdXNlJywgMjgpO1xyXG4gICAgdGhpcy50ZXh0UGF1c2UucG9zaXRpb24ueCA9IHRoaXMuZ2FtZS53aWR0aC8yIC0gdGhpcy50ZXh0UGF1c2UudGV4dFdpZHRoLzI7XHJcbiAgICB0aGlzLmFkZCh0aGlzLnRleHRQYXVzZSk7XHJcblxyXG4gICAgLy8gR3JvdXAgcG9zXHJcbiAgICB0aGlzLnkgPSAtODA7XHJcbiAgICB0aGlzLnggPSAwO1xyXG4gICAgdGhpcy5hbHBoYSA9IDA7XHJcblxyXG4gICAgLy8gUGxheSBidXR0b25cclxuICAgIHRoaXMuYnRuUGxheSA9IHRoaXMuZ2FtZS5hZGQuYnV0dG9uKHRoaXMuZ2FtZS53aWR0aC8yLTMyLCAxNSwgJ2J0bicsIHRoaXMudW5QYXVzZSwgdGhpcywgMywgMiwgMywgMik7XHJcbiAgICB0aGlzLmJ0blBsYXkuYW5jaG9yLnNldFRvKDAuNSwgMCk7XHJcbiAgICB0aGlzLmFkZCh0aGlzLmJ0blBsYXkpO1xyXG5cclxuICAgIC8vIEJ0biBNZW51XHJcbiAgICB0aGlzLmJ0bk1lbnUgPSB0aGlzLmdhbWUuYWRkLmJ1dHRvbih0aGlzLmdhbWUud2lkdGgvMisyOCwgMTUsICdidG4nLCBmdW5jdGlvbigpe1xyXG4gICAgICB0aGlzLmdhbWUuc3RhdGUuZ2V0Q3VycmVudFN0YXRlKCkuZ29Ub01lbnUoKTtcclxuICAgIH0sIHRoaXMsIDUsIDQsIDUsIDQpO1xyXG4gICAgdGhpcy5idG5NZW51LmFuY2hvci5zZXRUbygwLjUsIDApO1xyXG4gICAgdGhpcy5hZGQodGhpcy5idG5NZW51KTtcclxuICB9O1xyXG5cclxuICBHYW1lLlByZWZhYnMuUGF1c2VQYW5lbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5Hcm91cC5wcm90b3R5cGUpO1xyXG4gIEdhbWUuUHJlZmFicy5QYXVzZVBhbmVsLmNvbnN0cnVjdG9yID0gR2FtZS5QcmVmYWJzLlBhdXNlUGFuZWw7XHJcblxyXG4gIEdhbWUuUHJlZmFicy5QYXVzZVBhbmVsLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcykudG8oe2FscGhhOjEsIHk6dGhpcy5nYW1lLmhlaWdodC8yIC0gdGhpcy5wYW5lbC5oZWlnaHQvMn0sIDEwMDAsIFBoYXNlci5FYXNpbmcuRXhwb25lbnRpYWwuT3V0LCB0cnVlLCAwKTtcclxuICB9O1xyXG5cclxuICBHYW1lLlByZWZhYnMuUGF1c2VQYW5lbC5wcm90b3R5cGUudW5QYXVzZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMpLnRvKHthbHBoYTowLCB5Oi04MH0sIDEwMDAsIFBoYXNlci5FYXNpbmcuRXhwb25lbnRpYWwuT3V0LCB0cnVlLCAwKTtcclxuICAgIHRoaXMuZ2FtZS5zdGF0ZS5nZXRDdXJyZW50U3RhdGUoKS5wbGF5R2FtZSgpO1xyXG4gIH07XHJcblxyXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XHJcblxyXG4gIEdhbWUuUHJlZmFicy5QbGF5ZXIgPSBmdW5jdGlvbihnYW1lLCB4LCB5LCB0YXJnZXQsIGlkKSB7XHJcbiAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICBpZiAodGFyZ2V0KSB7XHJcbiAgICAgIFBoYXNlci5TcHJpdGUuY2FsbCh0aGlzLCBnYW1lLCB4LCB5LCAnaGVybycpO1xyXG4gICAgICAvLyBUYXJnZXQ6IG1vdXNlXHJcbiAgICAgIHRoaXMudGFyZ2V0ICAgICA9IHRhcmdldDtcclxuXHJcbiAgICAgIC8vIEZvbGxvdyBwb2ludGVyXHJcbiAgICAgIHRoaXMuZm9sbG93ID0gZmFsc2U7XHJcblxyXG4gICAgICAvLyBNaW5pbXVtIGF3YXlcclxuICAgICAgdGhpcy5taW5EaXN0YW5jZSA9IDEwO1xyXG5cclxuICAgICAgLy8gU3BlZWRcclxuICAgICAgdGhpcy5zcGVlZCAgICAgID0gMjAwO1xyXG5cclxuICAgICAgLy8gTGl2ZXNcclxuICAgICAgdGhpcy5saXZlcyAgICAgID0gMztcclxuXHJcbiAgICAgIC8vIFNob3QgZGVsYXlcclxuICAgICAgdGhpcy5zaG90RGVsYXkgID0gMTAwO1xyXG5cclxuICAgICAgLy8gTnVtYmVyIG9mIGJ1bGxldHMgcGVyIHNob3RcclxuICAgICAgdGhpcy5udW1CdWxsZXRzICAgPSAxMDtcclxuICAgICAgdGhpcy50aW1lckJ1bGxldDtcclxuXHJcbiAgICAgIHRoaXMuc2hpZWxkc0VuYWJsZWQgPSBmYWxzZTtcclxuICAgICAgdGhpcy50aW1lclNoaWVsZDtcclxuICAgICAgdGhpcy5zaGllbGQgPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnc2hpZWxkJyk7XHJcbiAgICAgIHRoaXMuc2hpZWxkLmFuY2hvci5zZXRUbygwLjUsIDAuNSk7XHJcbiAgICAgIHRoaXMuc2hpZWxkLmFscGhhID0gMFxyXG5cclxuICAgICAgLy8gU2NhbGVcclxuICAgICAgdGhpcy5zY2FsZS5zZXRUbygxLjIsIDEuMik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgeCwgeSwgJ2hlcm8nKTtcclxuXHJcbiAgICAgIHRoaXMuc2NhbGUuc2V0VG8oMC41LCAwLjUpO1xyXG4gICAgICB0aGlzLmFscGhhID0gMC44O1xyXG4gICAgICB0aGlzLnggPSB4O1xyXG4gICAgICB0aGlzLnkgPSB5O1xyXG5cclxuICAgICAgLy8gU3RhdGUgcXVldWVcclxuICAgICAgdGhpcy5zdGF0ZVF1ZXVlID0gW107XHJcbiAgICAgIHRoaXMubWluUXVldWVTaXplID0gMTA7XHJcbiAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMzA7XHJcbiAgICAgIHRoaXMucHJldmlvdXNTdGF0ZVRpbWUgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEV4cGxvc2lvblxyXG4gICAgdGhpcy5leHBsb3Npb24gPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSgwLDAsICdleHBsb3Npb24nKTtcclxuICAgIHRoaXMuZXhwbG9zaW9uLmFuY2hvci5zZXRUbygwLjUsIDAuNSk7XHJcbiAgICB0aGlzLmV4cGxvc2lvbi5hbHBoYSA9IDA7XHJcblxyXG4gICAgdGhpcy5oZWFsdGggPSAxMDA7XHJcbiAgICAvLyBBbmNob3JcclxuICAgIHRoaXMuYW5jaG9yLnNldFRvKDAuNSwgMC41KTtcclxuICAgIC8vIFJvdGF0ZSA5MHMgc28gaXQncyBmYWNpbmcgdXBcclxuICAgIHRoaXMucm90YXRpb24gPSAtTWF0aC5QSS8yO1xyXG5cclxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xyXG4gIH07XHJcblxyXG4gIEdhbWUuUHJlZmFicy5QbGF5ZXIucHJvdG90eXBlICAgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcclxuICBHYW1lLlByZWZhYnMuUGxheWVyLmNvbnN0cnVjdG9yID0gR2FtZS5QcmVmYWJzLlBsYXllcjtcclxuXHJcbiAgLy8gVXBkYXRlXHJcbiAgR2FtZS5QcmVmYWJzLlBsYXllci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAodGhpcy50YXJnZXQpIHtcclxuICAgICAgdGhpcy51cGRhdGVIZXJvKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnVwZGF0ZVJlbW90ZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgR2FtZS5QcmVmYWJzLlBsYXllci5wcm90b3R5cGUub25VcGRhdGVGcm9tU2VydmVyID0gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgaWYgKHRoaXMuc3RhdGVRdWV1ZS5sZW5ndGggPiB0aGlzLm1heFF1ZXVlU2l6ZSkge1xyXG4gICAgICB0aGlzLnN0YXRlUXVldWUuc3BsaWNlKHRoaXMubWluUXVldWVTaXplLCB0aGlzLm1heFF1ZXVlU2l6ZSAtIHRoaXMubWluUXVldWVTaXplKTtcclxuICAgIH1cclxuICAgIHRoaXMuc3RhdGVRdWV1ZS51bnNoaWZ0KGRhdGEpO1xyXG4gIH07XHJcblxyXG4gIEdhbWUuUHJlZmFicy5QbGF5ZXIucHJvdG90eXBlLnVwZGF0ZUhlcm8gPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBkaXN0YW5jZSwgcm90YXRpb247XHJcbiAgICAgIC8vIEZvbGxvdyBwb2ludGVyXHJcbiAgICBpZiAodGhpcy5mb2xsb3cpIHtcclxuICAgICAgZGlzdGFuY2UgPSB0aGlzLmdhbWUubWF0aC5kaXN0YW5jZSh0aGlzLngsIHRoaXMueSwgdGhpcy50YXJnZXQueCwgdGhpcy50YXJnZXQueSk7XHJcblxyXG4gICAgICBpZiAoZGlzdGFuY2UgPiB0aGlzLm1pbkRpc3RhbmNlKSB7XHJcbiAgICAgICAgcm90YXRpb24gPSB0aGlzLmdhbWUubWF0aC5hbmdsZUJldHdlZW4odGhpcy54LCB0aGlzLnksIHRoaXMudGFyZ2V0LngsIHRoaXMudGFyZ2V0LnkpO1xyXG5cclxuICAgICAgICB0aGlzLmJvZHkudmVsb2NpdHkueCA9IE1hdGguY29zKHJvdGF0aW9uKSAqIHRoaXMuc3BlZWQgKiBNYXRoLm1pbihkaXN0YW5jZSAvIDEyMCwgMik7XHJcbiAgICAgICAgdGhpcy5ib2R5LnZlbG9jaXR5LnkgPSBNYXRoLnNpbihyb3RhdGlvbikgKiB0aGlzLnNwZWVkICogTWF0aC5taW4oZGlzdGFuY2UgLyAxMjAsIDIpO1xyXG4gICAgICAgIHRoaXMucm90YXRpb24gPSByb3RhdGlvbjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmJvZHkudmVsb2NpdHkuc2V0VG8oMCwgMCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS5zZXRUbygwLCAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTaGllbGRzXHJcbiAgICBpZiAodGhpcy5zaGllbGRzRW5hYmxlZCkge1xyXG4gICAgICB0aGlzLnNoaWVsZC54ID0gdGhpcy54O1xyXG4gICAgICB0aGlzLnNoaWVsZC55ID0gdGhpcy55O1xyXG4gICAgICB0aGlzLnNoaWVsZC5yb3RhdGlvbiA9IHRoaXMucm90YXRpb247XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgR2FtZS5QcmVmYWJzLlBsYXllci5wcm90b3R5cGUudXBkYXRlUmVtb3RlID0gZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAodGhpcy5zdGF0ZVF1ZXVlLmxlbmd0aCA+IHRoaXMubWluUXVldWVTaXplKSB7XHJcbiAgICAgIHZhciBlYXJsaWVzdFF1ZXVlID0gdGhpcy5zdGF0ZVF1ZXVlLnBvcCgpO1xyXG5cclxuICAgICAgXHJcbiAgICAgIGlmICghdGhpcy5wcmV2aW91c1N0YXRlVGltZSkge1xyXG4gICAgICAgIHRoaXMucHJldmlvdXNTdGF0ZVRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHR3ZWVuVGltZSA9IE1hdGguYWJzKHRoaXMucHJldmlvdXNTdGF0ZVRpbWUgLSAoZWFybGllc3RRdWV1ZS50aW1lc3RhbXAgKyAxMCkpO1xyXG4gICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMpXHJcbiAgICAgICAgLnRvKHtcclxuICAgICAgICAgIHg6IGVhcmxpZXN0UXVldWUueCxcclxuICAgICAgICAgIHk6IGVhcmxpZXN0UXVldWUueSxcclxuICAgICAgICAgIHJvdGF0aW9uOiBlYXJsaWVzdFF1ZXVlLnJvdGF0aW9uXHJcbiAgICAgICAgfSwgdHdlZW5UaW1lLCBcclxuICAgICAgICBQaGFzZXIuRWFzaW5nLkxpbmVhci5Ob25lLCB0cnVlLCAwKTtcclxuXHJcbiAgICAgIHRoaXMucHJldmlvdXNTdGF0ZVRpbWUgPSBlYXJsaWVzdFF1ZXVlLnRpbWVzdGFtcDtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBHYW1lLlByZWZhYnMuUGxheWVyLnByb3RvdHlwZS5kaWUgPSBmdW5jdGlvbihhdXRvS2lsbCl7XHJcbiAgICBpZighdGhpcy5kZWFkKXtcclxuICAgICAgdGhpcy5kZWFkID0gdHJ1ZTtcclxuICAgICAgdGhpcy5hbHBoYSA9IDA7XHJcblxyXG4gICAgICAvLyBFeHBsb3Npb25cclxuICAgICAgaWYoIWF1dG9LaWxsKXtcclxuICAgICAgICB0aGlzLnNob3dFeHBsb3Npb24oKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIEdhbWUuUHJlZmFicy5QbGF5ZXIucHJvdG90eXBlLndhc0hpdEJ5ID0gZnVuY3Rpb24oYnVsbGV0LCBwbGF5ZXIpIHtcclxuICAgIGlmICghdGhpcy5zaGllbGRzRW5hYmxlZCkge1xyXG4gICAgICB0aGlzLmhlYWx0aCAtPSAxMDtcclxuXHJcbiAgICAgIGlmICh0aGlzLmhlYWx0aCA8PSAwKSB7XHJcbiAgICAgICAgdGhpcy5kaWUoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmVuYWJsZVNoaWVsZCgwLjMpO1xyXG4gICAgICAgIHRoaXMuc2hvd0V4cGxvc2lvbigpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBHYW1lLlByZWZhYnMuUGxheWVyLnByb3RvdHlwZS5zaG93RXhwbG9zaW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmV4cGxvc2lvbi5yZXNldCh0aGlzLngsIHRoaXMueSk7XHJcbiAgICB0aGlzLmV4cGxvc2lvbi5hbHBoYSA9IDA7XHJcbiAgICB0aGlzLmV4cGxvc2lvbi5zY2FsZS54ID0gMC4yO1xyXG4gICAgdGhpcy5leHBsb3Npb24uc2NhbGUueSA9IDAuMjtcclxuICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5leHBsb3Npb24pXHJcbiAgICAudG8oe2FscGhhOiAxLCBhbmdsZTogXCIrMzBcIn0sIDIwMCwgUGhhc2VyLkVhc2luZy5MaW5lYXIuTk9ORSwgdHJ1ZSwgMCkudG8oe2FscGhhOiAwLCBhbmdsZTogXCIrMzBcIn0sIDMwMCwgUGhhc2VyLkVhc2luZy5MaW5lYXIuTk9ORSwgdHJ1ZSwgMCk7XHJcbiAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMuZXhwbG9zaW9uLnNjYWxlKVxyXG4gICAgLnRvKHt4OjEuNSwgeToxLjV9LCA1MDAsIFBoYXNlci5FYXNpbmcuQ3ViaWMuT3V0LCB0cnVlLCAwKTtcclxuICB9O1xyXG5cclxuICBHYW1lLlByZWZhYnMuUGxheWVyLnByb3RvdHlwZS5lbmFibGVTaGllbGQgPSBmdW5jdGlvbihkdXJhdGlvbikge1xyXG4gICAgdGhpcy5zaGllbGRzRW5hYmxlZCA9IHRydWU7XHJcblxyXG4gICAgaWYgKHRoaXMudGltZXJTaGllbGQgJiYgIXRoaXMudGltZXJTaGllbGQuZXhwaXJlZCkge1xyXG4gICAgICB0aGlzLnRpbWVyU2hpZWxkLmRlc3Ryb3koKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRpbWVyU2hpZWxkID0gdGhpcy5nYW1lLnRpbWUuY3JlYXRlKHRydWUpO1xyXG4gICAgdGhpcy50aW1lclNoaWVsZC5hZGQoUGhhc2VyLlRpbWVyLlNFQ09ORCAqIGR1cmF0aW9uLCB0aGlzLmRpc2FibGVTaGllbGQsIHRoaXMpO1xyXG4gICAgdGhpcy50aW1lclNoaWVsZC5zdGFydCgpO1xyXG5cclxuICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5zaGllbGQpXHJcbiAgICAgIC50byh7YWxwaGE6IDF9LCAzMDAsIFBoYXNlci5FYXNpbmcuQ3ViaWMuT3V0LCB0cnVlLCAwKTtcclxuICB9O1xyXG5cclxuICBHYW1lLlByZWZhYnMuUGxheWVyLnByb3RvdHlwZS5kaXNhYmxlU2hpZWxkID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMuc2hpZWxkKVxyXG4gICAgICAudG8oe2FscGhhOiAwfSwgMzAwLCBcclxuICAgICAgICBQaGFzZXIuRWFzaW5nLkxpbmVhci5OT05FLCBcclxuICAgICAgICB0cnVlLFxyXG4gICAgICAgIDAsIDYsIHRydWUpLm9uQ29tcGxldGUuYWRkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgdGhpcy5zaGllbGRzRW5hYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gIH1cclxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5nYW1lJylcclxuLmRpcmVjdGl2ZSgnZ2FtZUNhbnZhcycsIGZ1bmN0aW9uKCR3aW5kb3csIG15U29ja2V0LCAkaW5qZWN0b3IpIHtcclxuXHJcbiAgdmFyIGxpbmtGbiA9IGZ1bmN0aW9uKHNjb3BlLCBlbGUsIGF0dHJzKSB7XHJcbiAgICB2YXIgdyA9IGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KTtcclxuICAgIHcuYmluZCgncmVzaXplJywgZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICAgIC8vIElmIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxyXG4gICAgfSk7XHJcblxyXG4gICAgbXlTb2NrZXQudGhlbihmdW5jdGlvbihzb2NrKSB7XHJcbiAgICAgIHJlcXVpcmUoJy4vbWFpbi5qcycpKFxyXG4gICAgICAgIGVsZSwgc2NvcGUsIHNvY2ssIFxyXG4gICAgICAgIHNjb3BlLm5nTW9kZWwsIFxyXG4gICAgICAgIHNjb3BlLm1hcElkLCBcclxuICAgICAgICAkaW5qZWN0b3IpO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHNjb3BlOiB7XHJcbiAgICAgIG5nTW9kZWw6ICc9JyxcclxuICAgICAgbWFwSWQ6ICc9J1xyXG4gICAgfSxcclxuICAgIHRlbXBsYXRlOiAnPGRpdiBpZD1cImdhbWUtY2FudmFzXCI+PC9kaXY+JyxcclxuICAgIGNvbXBpbGU6IGZ1bmN0aW9uKGlFbGUsIGlBdHRycykge1xyXG4gICAgICByZXR1cm4gbGlua0ZuO1xyXG4gICAgfVxyXG4gIH1cclxufSkiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmdhbWUnKVxyXG4uY29udHJvbGxlcignR2FtZUNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZVBhcmFtcywgbXlTb2NrZXQsIFVzZXIpIHtcclxuICAkc2NvcGUucGxheWVycyA9IFtdO1xyXG4gICRzY29wZS5tYXBJZCA9ICRzdGF0ZVBhcmFtcy5pZCB8fCAnMSc7XHJcblxyXG4gICRzY29wZS4kb24oJ2dhbWU6Z2V0QXZhaWxhYmxlUGxheWVycycsIGZ1bmN0aW9uKHBsYXllcnMpIHtcclxuICAgICRzY29wZS5wbGF5ZXJzID0gcGxheWVycztcclxuICB9KTtcclxuXHJcbiAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICRzY29wZS4kZW1pdCgncGxheWVyIGxlYXZpbmcnKTtcclxuICB9KTtcclxuXHJcbn0pOyIsIm1vZHVsZS5leHBvcnRzID1cclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5nYW1lJywgWyd1aS5yb3V0ZXInLCAnYXBwLnVzZXInXSlcclxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xyXG4gICRzdGF0ZVByb3ZpZGVyXHJcbiAgICAuc3RhdGUoJ2dhbWUnLCB7XHJcbiAgICAgIHVybDogJy9nYW1lJyxcclxuICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnL3NjcmlwdHMvZ2FtZS90ZW1wbGF0ZS5odG1sJ1xyXG4gICAgfSlcclxuICAgIC5zdGF0ZSgnZ2FtZS5wbGF5Jywge1xyXG4gICAgICB1cmw6ICcvOmlkJyxcclxuICAgICAgdGVtcGxhdGU6ICc8ZGl2PlxcXHJcbiAgICAgICAgPGRpdiBpZD1cImdhbWVDYW52YXNcIiBnYW1lLWNhbnZhcz1cInBsYXllcnNcIiBtYXAtaWQ9XCJtYXBJZFwiPjwvZGl2PlxcXHJcbiAgICAgIDwvZGl2PicsXHJcbiAgICAgIGNvbnRyb2xsZXI6ICdHYW1lQ29udHJvbGxlcicsXHJcbiAgICAgIG9uRW50ZXI6IGZ1bmN0aW9uKEdhbWUpIHtcclxuICAgICAgICBHYW1lLnBsYXlpbmcgPSB0cnVlO1xyXG4gICAgICB9LFxyXG4gICAgICBvbkV4aXQ6IGZ1bmN0aW9uKEdhbWUpIHtcclxuICAgICAgICBHYW1lLnBsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfSlcclxufSlcclxuXHJcbnJlcXVpcmUoJy4vZ2FtZV9jb250cm9sbGVyLmpzJylcclxucmVxdWlyZSgnLi9nYW1lX2NhbnZhcy5qcycpOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcblxyXG4vKipcclxuKiBAYXV0aG9yICAgICAgIEplcmVteSBEb3dlbGwgPGplcmVteUBjb2Rldmluc2t5LmNvbT5cclxuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwOi8vd3d3Lnd0ZnBsLm5ldC90eHQvY29weWluZy98V1RGUEx9XHJcbiovXHJcblxyXG4vKipcclxuKiBDcmVhdGVzIGEgbmV3IGBKdWljeWAgb2JqZWN0LlxyXG4qXHJcbiogQGNsYXNzIFBoYXNlci5QbHVnaW4uSnVpY3lcclxuKiBAY29uc3RydWN0b3JcclxuKlxyXG4qIEBwYXJhbSB7UGhhc2VyLkdhbWV9IGdhbWUgQ3VycmVudCBnYW1lIGluc3RhbmNlLlxyXG4qL1xyXG5cclxuUGhhc2VyLlBsdWdpbi5KdWljeSA9IGZ1bmN0aW9uIChnYW1lKSB7XHJcblxyXG4gIFBoYXNlci5QbHVnaW4uY2FsbCh0aGlzLCBnYW1lKTtcclxuXHJcbiAgLyoqXHJcbiAgKiBAcHJvcGVydHkge1BoYXNlci5SZWN0YW5nbGV9IF9ib3VuZHNDYWNoZSAtIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IHdvcmxkIGJvdW5kcy5cclxuICAqIEBwcml2YXRlXHJcbiAgKi9cclxuICB0aGlzLl9ib3VuZHNDYWNoZSA9IFBoYXNlci5VdGlscy5leHRlbmQoZmFsc2UsIHt9LCB0aGlzLmdhbWUud29ybGQuYm91bmRzKTtcclxuXHJcbiAgLyoqXHJcbiAgKiBAcHJvcGVydHkge251bWJlcn0gX3NoYWtlV29ybGRNYXggLSBUaGUgbWF4aW11bSB3b3JsZCBzaGFrZSByYWRpdXNcclxuICAqIEBwcml2YXRlXHJcbiAgKi9cclxuICB0aGlzLl9zaGFrZVdvcmxkTWF4ID0gMjA7XHJcblxyXG4gIC8qKlxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IF9zaGFrZVdvcmxkVGltZSAtIFRoZSBtYXhpbXVtIHdvcmxkIHNoYWtlIHRpbWVcclxuICAqIEBwcml2YXRlXHJcbiAgKi9cclxuICB0aGlzLl9zaGFrZVdvcmxkVGltZSA9IDA7XHJcblxyXG4gIC8qKlxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IF90cmFpbENvdW50ZXIgLSBBIGNvdW50IG9mIGhvdyBtYW55IHRyYWlscyB3ZSdyZSB0cmFja2luZ1xyXG4gICogQHByaXZhdGVcclxuICAqLyAgXHJcbiAgdGhpcy5fdHJhaWxDb3VudGVyID0gMDtcclxuXHJcbiAgLyoqXHJcbiAgKiBAcHJvcGVydHkge29iamVjdH0gX292ZXJTY2FsZXMgLSBBbiBvYmplY3QgY29udGFpbmluZyBvdmVyc2NhbGluZyBjb25maWd1cmF0aW9uc1xyXG4gICogQHByaXZhdGVcclxuICAqLyAgXHJcbiAgdGhpcy5fb3ZlclNjYWxlcyA9IHt9O1xyXG5cclxuICAvKipcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBfb3ZlclNjYWxlc0NvdW50ZXIgLSBBIGNvdW50IG9mIGhvdyBtYW55IG92ZXJTY2FsZXMgd2UncmUgdHJhY2tpbmdcclxuICAqIEBwcml2YXRlXHJcbiAgKi8gIFxyXG4gIHRoaXMuX292ZXJTY2FsZXNDb3VudGVyID0gMDtcclxufTtcclxuXHJcblxyXG5QaGFzZXIuUGx1Z2luLkp1aWN5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlBsdWdpbi5wcm90b3R5cGUpO1xyXG5QaGFzZXIuUGx1Z2luLkp1aWN5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBoYXNlci5QbHVnaW4uSnVpY3k7XHJcblxyXG5cclxuXHJcbi8qKlxyXG4qIENyZWF0ZXMgYSBuZXcgYEp1aWN5LlNjcmVlbkZsYXNoYCBvYmplY3QuXHJcbipcclxuKiBAY2xhc3MgUGhhc2VyLlBsdWdpbi5KdWljeS5TY3JlZW5GbGFzaFxyXG4qIEBjb25zdHJ1Y3RvclxyXG4qXHJcbiogQHBhcmFtIHtQaGFzZXIuR2FtZX0gZ2FtZSAtICBDdXJyZW50IGdhbWUgaW5zdGFuY2UuXHJcbiogQHBhcmFtIHtzdHJpbmd9IGNvbG9yPSd3aGl0ZScgLSBUaGUgY29sb3IgdG8gZmxhc2ggdGhlIHNjcmVlbi5cclxuKiBAbWVtYmVyb2YgUGhhc2VyLlBsdWdpbi5KdWljeVxyXG4qL1xyXG5QaGFzZXIuUGx1Z2luLkp1aWN5LlNjcmVlbkZsYXNoID0gZnVuY3Rpb24oZ2FtZSwgY29sb3IpIHtcclxuICBjb2xvciA9IGNvbG9yIHx8ICd3aGl0ZSc7XHJcbiAgdmFyIGJtZCA9IGdhbWUuYWRkLmJpdG1hcERhdGEoZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQpO1xyXG4gIGJtZC5jdHguZmlsbFN0eWxlID0gJ3doaXRlJztcclxuICBibWQuY3R4LmZpbGxSZWN0KDAsMCwgZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQpO1xyXG5cclxuICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgMCwwLCBibWQpO1xyXG4gIHRoaXMuYWxwaGEgPSAwO1xyXG59O1xyXG5cclxuUGhhc2VyLlBsdWdpbi5KdWljeS5TY3JlZW5GbGFzaC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcclxuUGhhc2VyLlBsdWdpbi5KdWljeS5TY3JlZW5GbGFzaC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQaGFzZXIuUGx1Z2luLkp1aWN5LlNjcmVlbkZsYXNoO1xyXG5cclxuXHJcbi8qXHJcbiogRmxhc2hlcyB0aGUgc2NyZWVuXHJcbipcclxuKiBAcGFyYW0ge251bWJlcn0gW21heEFscGhhPTFdIC0gVGhlIG1heGltdW0gYWxwaGEgdG8gZmxhc2ggdGhlIHNjcmVlbiB0b1xyXG4qIEBwYXJhbSB7bnVtYmVyfSBbZHVyYXRpb249MTAwXSAtIFRoZSBkdXJhdGlvbiBvZiB0aGUgZmxhc2ggaW4gbWlsbGlzZWNvbmRzXHJcbiogQG1ldGhvZCBQaGFzZXIuUGx1Z2luLkp1aWN5LlNjcmVlbkZsYXNoLnByb3RvdHlwZS5mbGFzaFxyXG4qIEBtZW1iZXJvZiBQaGFzZXIuUGx1Z2luLkp1aWN5LlNjcmVlbkZsYXNoXHJcbiovXHJcblBoYXNlci5QbHVnaW4uSnVpY3kuU2NyZWVuRmxhc2gucHJvdG90eXBlLmZsYXNoID0gZnVuY3Rpb24obWF4QWxwaGEsIGR1cmF0aW9uKSB7XHJcbiAgbWF4QWxwaGEgPSBtYXhBbHBoYSB8fCAxO1xyXG4gIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgMTAwO1xyXG4gIHZhciBmbGFzaFR3ZWVuID0gdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzKS50byh7YWxwaGE6IG1heEFscGhhfSwgMTAwLCBQaGFzZXIuRWFzaW5nLkJvdW5jZS5Jbk91dCwgdHJ1ZSwwLCAwLCB0cnVlKTtcclxuICBmbGFzaFR3ZWVuLm9uQ29tcGxldGUuYWRkKGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5hbHBoYSA9IDA7XHJcbiAgfSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuKiBDcmVhdGVzIGEgbmV3IGBKdWljeS5UcmFpbGAgb2JqZWN0LlxyXG4qXHJcbiogQGNsYXNzIFBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWxcclxuKiBAY29uc3RydWN0b3JcclxuKlxyXG4qIEBwYXJhbSB7UGhhc2VyLkdhbWV9IGdhbWUgLSAgQ3VycmVudCBnYW1lIGluc3RhbmNlLlxyXG4qIEBwYXJhbSB7bnVtYmVyfSBbdHJhaWxMZW5ndGg9MTAwXSAtIFRoZSBsZW5ndGggb2YgdGhlIHRyYWlsXHJcbiogQHBhcmFtIHtudW1iZXJ9IFtjb2xvcj0weEZGRkZGRl0gLSBUaGUgY29sb3Igb2YgdGhlIHRyYWlsXHJcbiogQG1lbWJlcm9mIFBoYXNlci5QbHVnaW4uSnVpY3lcclxuKi9cclxuUGhhc2VyLlBsdWdpbi5KdWljeS5UcmFpbCA9IGZ1bmN0aW9uKGdhbWUsIHRyYWlsTGVuZ3RoLCBjb2xvcikge1xyXG4gIFBoYXNlci5HcmFwaGljcy5jYWxsKHRoaXMsIGdhbWUsIDAsMCk7XHJcbiAgXHJcbiAgLyoqXHJcbiAgKiBAcHJvcGVydHkge1BoYXNlci5TcHJpdGV9IHRhcmdldCAtIFRoZSB0YXJnZXQgc3ByaXRlIHdob3NlIG1vdmVtZW50IHdlIHdhbnQgdG8gY3JlYXRlIHRoZSB0cmFpbCBmcm9tXHJcbiAgKi9cclxuICB0aGlzLnRhcmdldCA9IG51bGw7XHJcbiAgLyoqXHJcbiAgKiBAcHJvcGVydHkge251bWJlcn0gdHJhaWxMZW5ndGggLSBUaGUgbnVtYmVyIG9mIHNlZ21lbnRzIHRvIHVzZSB0byBjcmVhdGUgdGhlIHRyYWlsXHJcbiAgKi9cclxuICB0aGlzLnRyYWlsTGVuZ3RoID0gdHJhaWxMZW5ndGggfHwgMTAwO1xyXG4gIC8qKlxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IHRyYWlsV2lkdGggLSBUaGUgd2lkdGggb2YgdGhlIHRyYWlsXHJcbiAgKi9cclxuICB0aGlzLnRyYWlsV2lkdGggPSAxNS4wO1xyXG5cclxuICAvKipcclxuICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdHJhaWxTY2FsZSAtIFdoZXRoZXIgb3Igbm90IHRvIHRhcGVyIHRoZSB0cmFpbCB0b3dhcmRzIHRoZSBlbmRcclxuICAqL1xyXG4gIHRoaXMudHJhaWxTY2FsaW5nID0gZmFsc2U7XHJcblxyXG4gIC8qKlxyXG4gICogQHByb3BlcnR5IHtQaGFzZXIuU3ByaXRlfSB0cmFpbENvbG9yIC0gVGhlIGNvbG9yIG9mIHRoZSB0cmFpbFxyXG4gICovXHJcbiAgdGhpcy50cmFpbENvbG9yID0gY29sb3IgfHwgMHhGRkZGRkY7XHJcbiAgXHJcbiAgLyoqXHJcbiAgKiBAcHJvcGVydHkge0FycmF5PFBoYXNlci5Qb2ludD59IF9zZWdtZW50cyAtIEEgaGlzdG9yaWNhbCBjb2xsZWN0aW9uIG9mIHRoZSBwcmV2aW91cyBwb3NpdGlvbiBvZiB0aGUgdGFyZ2V0XHJcbiAgKiBAcHJpdmF0ZVxyXG4gICovXHJcbiAgdGhpcy5fc2VnbWVudHMgPSBbXTtcclxuICAvKipcclxuICAqIEBwcm9wZXJ0eSB7QXJyYXk8bnVtYmVyPn0gX3ZlcnRzIC0gQSBjb2xsZWN0aW9uIG9mIHZlcnRpY2VzIGNyZWF0ZWQgZnJvbSBfc2VnbWVudHNcclxuICAqIEBwcml2YXRlXHJcbiAgKi9cclxuICB0aGlzLl92ZXJ0cyA9IFtdO1xyXG4gIC8qKlxyXG4gICogQHByb3BlcnR5IHtBcnJheTxQaGFzZXIuUG9pbnQ+fSBfc2VnbWVudHMgLSBBIGNvbGxlY3Rpb24gb2YgaW5kaWNlcyBjcmVhdGVkIGZyb20gX3ZlcnRzXHJcbiAgKiBAcHJpdmF0ZVxyXG4gICovXHJcbiAgdGhpcy5faW5kaWNlcyA9IFtdO1xyXG5cclxufTtcclxuXHJcblBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuR3JhcGhpY3MucHJvdG90eXBlKTtcclxuUGhhc2VyLlBsdWdpbi5KdWljeS5UcmFpbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsO1xyXG5cclxuLyoqXHJcbiogVXBkYXRlcyB0aGUgVHJhaWwgaWYgYSB0YXJnZXQgaXMgc2V0XHJcbipcclxuKiBAbWV0aG9kIFBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWwjdXBkYXRlXHJcbiogQG1lbWJlcm9mIFBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWxcclxuKi9cclxuXHJcblBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWwucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmKHRoaXMudGFyZ2V0KSB7XHJcbiAgICB0aGlzLnggPSB0aGlzLnRhcmdldC54O1xyXG4gICAgdGhpcy55ID0gdGhpcy50YXJnZXQueTtcclxuICAgIHRoaXMuYWRkU2VnbWVudCh0aGlzLnRhcmdldC54LCB0aGlzLnRhcmdldC55KTtcclxuICAgIHRoaXMucmVkcmF3U2VnbWVudHModGhpcy50YXJnZXQueCwgdGhpcy50YXJnZXQueSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiogQWRkcyBhIHNlZ21lbnQgdG8gdGhlIHNlZ21lbnRzIGxpc3QgYW5kIGN1bGxzIHRoZSBsaXN0IGlmIGl0IGlzIHRvbyBsb25nXHJcbiogXHJcbiogQHBhcmFtIHtudW1iZXJ9IFt4XSAtIFRoZSB4IHBvc2l0aW9uIG9mIHRoZSBwb2ludFxyXG4qIEBwYXJhbSB7bnVtYmVyfSBbeV0gLSBUaGUgeSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRcclxuKiBcclxuKiBAbWV0aG9kIFBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWwjYWRkU2VnbWVudFxyXG4qIEBtZW1iZXJvZiBQaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsXHJcbiovXHJcblBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWwucHJvdG90eXBlLmFkZFNlZ21lbnQgPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgdmFyIHNlZ21lbnQ7XHJcblxyXG4gIHdoaWxlKHRoaXMuX3NlZ21lbnRzLmxlbmd0aCA+IHRoaXMudHJhaWxMZW5ndGgpIHtcclxuICAgIHNlZ21lbnQgPSB0aGlzLl9zZWdtZW50cy5zaGlmdCgpO1xyXG4gIH1cclxuICBpZighc2VnbWVudCkge1xyXG4gICAgc2VnbWVudCA9IG5ldyBQaGFzZXIuUG9pbnQoKTtcclxuICB9XHJcblxyXG4gIHNlZ21lbnQueCA9IHg7XHJcbiAgc2VnbWVudC55ID0geTtcclxuXHJcbiAgdGhpcy5fc2VnbWVudHMucHVzaChzZWdtZW50KTtcclxufTtcclxuXHJcblxyXG4vKipcclxuKiBDcmVhdGVzIGFuZCBkcmF3cyB0aGUgdHJpYW5nbGUgdHJhaWwgZnJvbSBzZWdtZW50c1xyXG4qIFxyXG4qIEBwYXJhbSB7bnVtYmVyfSBbb2Zmc2V0WF0gLSBUaGUgeCBwb3NpdGlvbiBvZiB0aGUgb2JqZWN0XHJcbiogQHBhcmFtIHtudW1iZXJ9IFtvZmZzZXRZXSAtIFRoZSB5IHBvc2l0aW9uIG9mIHRoZSBvYmplY3RcclxuKiBcclxuKiBAbWV0aG9kIFBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWwjcmVkcmF3U2VnbWVudFxyXG4qIEBtZW1iZXJvZiBQaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsXHJcbiovXHJcblBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWwucHJvdG90eXBlLnJlZHJhd1NlZ21lbnRzID0gZnVuY3Rpb24ob2Zmc2V0WCwgb2Zmc2V0WSkge1xyXG4gIHRoaXMuY2xlYXIoKTtcclxuICB2YXIgczEsIC8vIGN1cnJlbnQgc2VnbWVudFxyXG4gICAgICBzMiwgLy8gcHJldmlvdXMgc2VnbWVudFxyXG4gICAgICB2ZXJ0SW5kZXggPSAwLCAvLyBrZWVwcyB0cmFjayBvZiB3aGljaCB2ZXJ0ZXggaW5kZXggd2UncmUgYXRcclxuICAgICAgb2Zmc2V0LCAvLyB0ZW1wb3Jhcnkgc3RvcmFnZSBmb3IgYW1vdW50IHRvIGV4dGVuZCBsaW5lIG91dHdhcmRzLCBiaWdnZXIgPSB3aWRlclxyXG4gICAgICBhbmcsIC8vdGVtcG9yYXJ5IHN0b3JhZ2Ugb2YgdGhlIGludGVyLXNlZ21lbnQgYW5nbGVzXHJcbiAgICAgIHNpbiA9IDAsIC8vIGFzIGFib3ZlXHJcbiAgICAgIGNvcyA9IDA7IC8vIGFnYWluIGFzIGFib3ZlXHJcblxyXG4gIC8vIGZpcnN0IHdlIG1ha2Ugc3VyZSB0aGF0IHRoZSB2ZXJ0aWNlIGxpc3QgaXMgdGhlIHNhbWUgbGVuZ3RoIGFzIHdlIHdlIHdhbnRcclxuICAvLyBlYWNoIHNlZ21lbnQgKGV4Y2VwdCB0aGUgZmlyc3QpIHdpbGwgY3JlYXRlIHRvIHZlcnRpY2VzIHdpdGggdHdvIHZhbHVlcyBlYWNoXHJcbiAgaWYgKHRoaXMuX3ZlcnRzLmxlbmd0aCAhPT0gKHRoaXMuX3NlZ21lbnRzLmxlbmd0aCAtMSkgKiA0KSB7XHJcbiAgICAvLyBpZiBpdCdzIG5vdCBjb3JyZWN0LCB3ZSBjbGVhciB0aGUgZW50aXJlIGxpc3RcclxuICAgIHRoaXMuX3ZlcnRzID0gW107XHJcbiAgfVxyXG5cclxuICAvLyBub3cgd2UgbG9vcCBvdmVyIGFsbCB0aGUgc2VnbWVudHMsIHRoZSBsaXN0IGhhcyB0aGUgXCJ5b3VuZ2VzdFwiIHNlZ21lbnQgYXQgdGhlIGVuZFxyXG4gIHZhciBwcmV2QW5nID0gMDtcclxuICBcclxuICBmb3IodmFyIGogPSAwOyBqIDwgdGhpcy5fc2VnbWVudHMubGVuZ3RoOyArK2opIHtcclxuICAgIC8vIHN0b3JlIHRoZSBhY3RpdmUgc2VnbWVudCBmb3IgY29udmVuaWVuY2VcclxuICAgIHMxID0gdGhpcy5fc2VnbWVudHNbal07XHJcblxyXG4gICAgLy8gaWYgdGhlcmUncyBhIHByZXZpb3VzIHNlZ21lbnQsIHRpbWUgdG8gZG8gc29tZSBtYXRoXHJcbiAgICBpZihzMikge1xyXG4gICAgICAvLyB3ZSBjYWxjdWxhdGUgdGhlIGFuZ2xlIGJldHdlZW4gdGhlIHR3byBzZWdtZW50c1xyXG4gICAgICAvLyB0aGUgcmVzdWx0IHdpbGwgYmUgaW4gcmFkaWFucywgc28gYWRkaW5nIGhhbGYgb2YgcGkgd2lsbCBcInR1cm5cIiB0aGUgYW5nbGUgOTAgZGVncmVlc1xyXG4gICAgICAvLyB0aGF0IG1lYW5zIHdlIGNhbiB1c2UgdGhlIHNpbiBhbmQgY29zIHZhbHVlcyB0byBcImV4cGFuZFwiIHRoZSBsaW5lIG91dHdhcmRzXHJcbiAgICAgIGFuZyA9IE1hdGguYXRhbjIoczEueSAtIHMyLnksIHMxLnggLSBzMi54KSArIE1hdGguUEkgLyAyO1xyXG4gICAgICBzaW4gPSBNYXRoLnNpbihhbmcpO1xyXG4gICAgICBjb3MgPSBNYXRoLmNvcyhhbmcpO1xyXG5cclxuICAgICAgLy8gbm93IGl0J3MgdGltZSB0byBjcmVhdCBldGhlIHR3byB2ZXJ0aWNlcyB0aGF0IHdpbGwgcmVwcmVzZW50IHRoaXMgcGFpciBvZiBzZWdtZW50c1xyXG4gICAgICAvLyB1c2luZyBhIGxvb3AgaGVyZSBpcyBwcm9iYWJseSBhIGJpdCBvdmVya2lsbCBzaW5jZSBpdCdzIG9ubHkgdHdvIGl0ZXJhdGlvbnNcclxuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IDI7ICsraSkge1xyXG4gICAgICAgIC8vIHRoaXMgbWFrZXMgdGhlIGZpcnN0IHNlZ21lbnQgc3RhbmQgb3V0IHRvIHRoZSBcImxlZnRcIiBvZiB0aGUgbGluZVxyXG4gICAgICAgIC8vIGFubmQgdGhlIHNlY29uZCB0byB0aGUgcmlnaHQsIGNoYW5naW5nIHRoYXQgbWFnaWMgbnVtYmVyIGF0IHRoZSBlbmQgd2lsbCBhbHRoZXIgdGhlIGxpbmUgd2lkdGhcclxuICAgICAgICBvZmZzZXQgPSAoIC0wLjUgKyBpIC8gMSkgKiB0aGlzLnRyYWlsV2lkdGg7XHJcblxyXG4gICAgICAgIC8vIGlmIHRyYWlsIHNjYWxlIGVmZmVjdCBpcyBlbmFibGVkLCB3ZSBzY2FsZSBkb3duIHRoZSBvZmZzZXQgYXMgd2UgbW92ZSBkb3duIHRoZSBsaXN0XHJcbiAgICAgICAgaWYodGhpcy50cmFpbFNjYWxpbmcpIHtcclxuICAgICAgICAgIG9mZnNldCAqPSBqIC8gdGhpcy5fc2VnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmluYWxseSB3ZSBwdXQgdG8gdmFsdWVzIGluIHRoZSB2ZXJ0IGxpc3RcclxuICAgICAgICAvLyB1c2luZyB0aGUgc2VnbWVudCBjb29yZGluYXRlcyBhcyBhIGJhc2Ugd2UgYWRkIHRoZSBcImV4dGVuZGVkXCIgcG9pbnRcclxuICAgICAgICAvLyBvZmZzZXRYIGFuZCBvZmZzZXRZIGFyZSB1c2VkIGhlciB0byBtb3ZlIHRoZSBlbnRpcmUgdHJhaWxcclxuICAgICAgICB0aGlzLl92ZXJ0c1t2ZXJ0SW5kZXgrK10gPSBzMS54ICsgY29zICogb2Zmc2V0IC0gb2Zmc2V0WDtcclxuICAgICAgICB0aGlzLl92ZXJ0c1t2ZXJ0SW5kZXgrK10gPSBzMS55ICsgc2luICogb2Zmc2V0IC0gb2Zmc2V0WTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gZmluYWxseSBzdG9yZSB0aGUgY3VycmVudCBzZWdtZW50IGFzIHRoZSBwcmV2aW91cyBzZWdtZW50IGFuZCBnbyBmb3IgYW5vdGhlciByb3VuZFxyXG4gICAgczIgPSBzMS5jb3B5VG8oe30pO1xyXG4gIH1cclxuICAvLyB3ZSBuZWVkIGF0IGxlYXN0IGZvdXIgdmVydGljZXMgdG8gZHJhdyBzb21ldGhpbmdcclxuICBpZih0aGlzLl92ZXJ0cy5sZW5ndGggPj0gOCkge1xyXG4gICAgLy8gbm93LCB3ZSBoYXZlIGEgdHJpYW5nbGUgXCJzdHJpcFwiLCBidXQgZmxhc2ggY2FuJ3QgZHJhdyB0aGF0IHdpdGhvdXQgXHJcbiAgICAvLyBpbnN0cnVjdGlvbnMgZm9yIHdoaWNoIHZlcnRpY2VzIHRvIGNvbm5lY3QsIHNvIGl0J3MgdGltZSB0byBtYWtlIHRob3NlXHJcbiAgICBcclxuICAgIC8vIGhlcmUsIHdlIGxvb3Agb3ZlciBhbGwgdGhlIHZlcnRpY2VzIGFuZCBwYWlyIHRoZW0gdG9nZXRoZXIgaW4gdHJpYW5nbGVzXHJcbiAgICAvLyBlYWNoIGdyb3VwIG9mIGZvdXIgdmVydGljZXMgZm9ybXMgdHdvIHRyaWFuZ2xlc1xyXG4gICAgZm9yKHZhciBrID0gMDsgayA8IHRoaXMuX3ZlcnRzLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgIHRoaXMuX2luZGljZXNbayAqIDYgKyAwXSA9IGsgKiAyICsgMDtcclxuICAgICAgdGhpcy5faW5kaWNlc1trICogNiArIDFdID0gayAqIDIgKyAxO1xyXG4gICAgICB0aGlzLl9pbmRpY2VzW2sgKiA2ICsgMl0gPSBrICogMiArIDI7XHJcbiAgICAgIHRoaXMuX2luZGljZXNbayAqIDYgKyAzXSA9IGsgKiAyICsgMTtcclxuICAgICAgdGhpcy5faW5kaWNlc1trICogNiArIDRdID0gayAqIDIgKyAyO1xyXG4gICAgICB0aGlzLl9pbmRpY2VzW2sgKiA2ICsgNV0gPSBrICogMiArIDM7XHJcbiAgICB9XHJcbiAgICB0aGlzLmJlZ2luRmlsbCh0aGlzLnRyYWlsQ29sb3IpO1xyXG4gICAgdGhpcy5kcmF3VHJpYW5nbGVzKHRoaXMuX3ZlcnRzLCB0aGlzLl9pbmRpY2VzKTtcclxuICAgIHRoaXMuZW5kRmlsbCgpO1xyXG4gICAgXHJcbiAgfVxyXG59O1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4vKipcclxuKiBBZGQgYSBTcHJpdGUgcmVmZXJlbmNlIHRvIHRoaXMgUGx1Z2luLlxyXG4qIEFsbCB0aGlzIHBsdWdpbiBkb2VzIGlzIG1vdmUgdGhlIFNwcml0ZSBhY3Jvc3MgdGhlIHNjcmVlbiBzbG93bHkuXHJcbiogQHR5cGUge1BoYXNlci5TcHJpdGV9XHJcbiovXHJcblxyXG4vKipcclxuKiBCZWdpbnMgdGhlIHNjcmVlbiBzaGFrZSBlZmZlY3RcclxuKiBcclxuKiBAcGFyYW0ge251bWJlcn0gW2R1cmF0aW9uPTIwXSAtIFRoZSBkdXJhdGlvbiBvZiB0aGUgc2NyZWVuIHNoYWtlXHJcbiogQHBhcmFtIHtudW1iZXJ9IFtzdHJlbmd0aD0yMF0gLSBUaGUgc3RyZW5ndGggb2YgdGhlIHNjcmVlbiBzaGFrZVxyXG4qIFxyXG4qIEBtZXRob2QgUGhhc2VyLlBsdWdpbi5KdWljeSNyZWRyYXdTZWdtZW50XHJcbiogQG1lbWJlcm9mIFBoYXNlci5QbHVnaW4uSnVpY3lcclxuKi9cclxuUGhhc2VyLlBsdWdpbi5KdWljeS5wcm90b3R5cGUuc2hha2UgPSBmdW5jdGlvbiAoZHVyYXRpb24sIHN0cmVuZ3RoKSB7XHJcbiAgdGhpcy5fc2hha2VXb3JsZFRpbWUgPSBkdXJhdGlvbiB8fCAyMDtcclxuICB0aGlzLl9zaGFrZVdvcmxkTWF4ID0gc3RyZW5ndGggfHwgMjA7XHJcbiAgdGhpcy5nYW1lLndvcmxkLnNldEJvdW5kcyh0aGlzLl9ib3VuZHNDYWNoZS54IC0gdGhpcy5fc2hha2VXb3JsZE1heCwgdGhpcy5fYm91bmRzQ2FjaGUueSAtIHRoaXMuX3NoYWtlV29ybGRNYXgsIHRoaXMuX2JvdW5kc0NhY2hlLndpZHRoICsgdGhpcy5fc2hha2VXb3JsZE1heCwgdGhpcy5fYm91bmRzQ2FjaGUuaGVpZ2h0ICsgdGhpcy5fc2hha2VXb3JsZE1heCk7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiogQ3JlYXRlcyBhICdKdWljeS5TY3JlZW5GbGFzaCcgb2JqZWN0XHJcbipcclxuKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgLSBUaGUgY29sb3Igb2YgdGhlIHNjcmVlbiBmbGFzaFxyXG4qIFxyXG4qIEB0eXBlIHtQaGFzZXIuUGx1Z2luLkp1aWN5LlNjcmVlbkZsYXNofVxyXG4qL1xyXG5cclxuUGhhc2VyLlBsdWdpbi5KdWljeS5wcm90b3R5cGUuY3JlYXRlU2NyZWVuRmxhc2ggPSBmdW5jdGlvbihjb2xvcikge1xyXG4gICAgcmV0dXJuIG5ldyBQaGFzZXIuUGx1Z2luLkp1aWN5LlNjcmVlbkZsYXNoKHRoaXMuZ2FtZSwgY29sb3IpO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4qIENyZWF0ZXMgYSAnSnVpY3kuVHJhaWwnIG9iamVjdFxyXG4qXHJcbiogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCAtIFRoZSBsZW5ndGggb2YgdGhlIHRyYWlsXHJcbiogQHBhcmFtIHtudW1iZXJ9IGNvbG9yIC0gVGhlIGNvbG9yIG9mIHRoZSB0cmFpbFxyXG4qIFxyXG4qIEB0eXBlIHtQaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsfVxyXG4qL1xyXG5QaGFzZXIuUGx1Z2luLkp1aWN5LnByb3RvdHlwZS5jcmVhdGVUcmFpbCA9IGZ1bmN0aW9uKGxlbmd0aCwgY29sb3IpIHtcclxuICByZXR1cm4gbmV3IFBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWwodGhpcy5nYW1lLCBsZW5ndGgsIGNvbG9yKTtcclxufTtcclxuXHJcblxyXG4vKipcclxuKiBDcmVhdGVzIHRoZSBvdmVyIHNjYWxlIGVmZmVjdCBvbiB0aGUgZ2l2ZW4gb2JqZWN0XHJcbipcclxuKiBAcGFyYW0ge1BoYXNlci5TcHJpdGV9IG9iamVjdCAtIFRoZSBvYmplY3QgdG8gb3ZlciBzY2FsZVxyXG4qIEBwYXJhbSB7bnVtYmVyfSBbc2NhbGU9MS41XSAtIFRoZSBzY2FsZSBhbW91bnQgdG8gb3ZlcnNjYWxlIGJ5XHJcbiogQHBhcmFtIHtQaGFzZXIuUG9pbnR9IFtpbml0aWFsU2NhbGU9bmV3IFBoYXNlci5Qb2ludCgxLDEpXSAtIFRoZSBpbml0aWFsIHNjYWxlIG9mIHRoZSBvYmplY3RcclxuKiBcclxuKi9cclxuUGhhc2VyLlBsdWdpbi5KdWljeS5wcm90b3R5cGUub3ZlclNjYWxlID0gZnVuY3Rpb24ob2JqZWN0LCBzY2FsZSwgaW5pdGlhbFNjYWxlKSB7XHJcbiAgc2NhbGUgPSBzY2FsZSB8fCAxLjU7XHJcbiAgdmFyIGlkID0gdGhpcy5fb3ZlclNjYWxlc0NvdW50ZXIrKztcclxuICBpbml0aWFsU2NhbGUgPSBpbml0aWFsU2NhbGUgfHwgbmV3IFBoYXNlci5Qb2ludCgxLDEpO1xyXG4gIHZhciBzY2FsZU9iaiA9IHRoaXMuX292ZXJTY2FsZXNbaWRdO1xyXG4gIGlmKCFzY2FsZU9iaikge1xyXG4gICAgc2NhbGVPYmogPSB7XHJcbiAgICAgIG9iamVjdDogb2JqZWN0LFxyXG4gICAgICBjYWNoZTogaW5pdGlhbFNjYWxlLmNvcHlUbyh7fSlcclxuICAgIH07XHJcbiAgfSBcclxuICBzY2FsZU9iai5zY2FsZSA9IHNjYWxlO1xyXG4gIFxyXG4gIHRoaXMuX292ZXJTY2FsZXNbaWRdID0gc2NhbGVPYmo7XHJcbn07XHJcblxyXG4vKipcclxuKiBDcmVhdGVzIHRoZSBqZWxseSBlZmZlY3Qgb24gdGhlIGdpdmVuIG9iamVjdFxyXG4qXHJcbiogQHBhcmFtIHtQaGFzZXIuU3ByaXRlfSBvYmplY3QgLSBUaGUgb2JqZWN0IHRvIGdlbGF0aW5pemVcclxuKiBAcGFyYW0ge251bWJlcn0gW3N0cmVuZ3RoPTAuMl0gLSBUaGUgc3RyZW5ndGggb2YgdGhlIGVmZmVjdFxyXG4qIEBwYXJhbSB7bnVtYmVyfSBbZGVsYXk9MF0gLSBUaGUgZGVsYXkgb2YgdGhlIHNuYXAtYmFjayB0d2Vlbi4gNTBtcyBhcmUgYXV0b21hdGljYWxsbHkgYWRkZWQgdG8gd2hhdGV2ZXIgdGhlIGRlbGF5IGFtb3VudCBpcy5cclxuKiBAcGFyYW0ge1BoYXNlci5Qb2ludH0gW2luaXRpYWxTY2FsZT1uZXcgUGhhc2VyLlBvaW50KDEsMSldIC0gVGhlIGluaXRpYWwgc2NhbGUgb2YgdGhlIG9iamVjdFxyXG4qIFxyXG4qL1xyXG5QaGFzZXIuUGx1Z2luLkp1aWN5LnByb3RvdHlwZS5qZWxseSA9IGZ1bmN0aW9uKG9iamVjdCwgc3RyZW5ndGgsIGRlbGF5LCBpbml0aWFsU2NhbGUpIHtcclxuICBzdHJlbmd0aCA9IHN0cmVuZ3RoIHx8IDAuMjtcclxuICBkZWxheSA9IGRlbGF5IHx8IDA7XHJcbiAgaW5pdGlhbFNjYWxlID0gaW5pdGlhbFNjYWxlIHx8ICBuZXcgUGhhc2VyLlBvaW50KDEsIDEpO1xyXG4gIFxyXG4gIHRoaXMuZ2FtZS5hZGQudHdlZW4ob2JqZWN0LnNjYWxlKS50byh7eDogaW5pdGlhbFNjYWxlLnggKyAoaW5pdGlhbFNjYWxlLnggKiBzdHJlbmd0aCl9LCA1MCwgUGhhc2VyLkVhc2luZy5RdWFkcmF0aWMuSW5PdXQsIHRydWUsIGRlbGF5KVxyXG4gIC50byh7eDogaW5pdGlhbFNjYWxlLnh9LCA2MDAsIFBoYXNlci5FYXNpbmcuRWxhc3RpYy5PdXQsIHRydWUpO1xyXG5cclxuICB0aGlzLmdhbWUuYWRkLnR3ZWVuKG9iamVjdC5zY2FsZSkudG8oe3k6IGluaXRpYWxTY2FsZS55ICsgKGluaXRpYWxTY2FsZS55ICogc3RyZW5ndGgpfSwgNTAsIFBoYXNlci5FYXNpbmcuUXVhZHJhdGljLkluT3V0LCB0cnVlLCBkZWxheSArIDUwKVxyXG4gIC50byh7eTogaW5pdGlhbFNjYWxlLnl9LCA2MDAsIFBoYXNlci5FYXNpbmcuRWxhc3RpYy5PdXQsIHRydWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiogQ3JlYXRlcyB0aGUgbW91c2Ugc3RyZXRjaCBlZmZlY3Qgb24gdGhlIGdpdmVuIG9iamVjdFxyXG4qXHJcbiogQHBhcmFtIHtQaGFzZXIuU3ByaXRlfSBvYmplY3QgLSBUaGUgb2JqZWN0IHRvIG1vdXNlIHN0cmV0Y2hcclxuKiBAcGFyYW0ge251bWJlcn0gW3N0cmVuZ3RoPTAuNV0gLSBUaGUgc3RyZW5ndGggb2YgdGhlIGVmZmVjdFxyXG4qIEBwYXJhbSB7UGhhc2VyLlBvaW50fSBbaW5pdGlhbFNjYWxlPW5ldyBQaGFzZXIuUG9pbnQoMSwxKV0gLSBUaGUgaW5pdGlhbCBzY2FsZSBvZiB0aGUgb2JqZWN0XHJcbiogXHJcbiovXHJcblBoYXNlci5QbHVnaW4uSnVpY3kucHJvdG90eXBlLm1vdXNlU3RyZXRjaCA9IGZ1bmN0aW9uKG9iamVjdCwgc3RyZW5ndGgsIGluaXRpYWxTY2FsZSkge1xyXG4gICAgc3RyZW5ndGggPSBzdHJlbmd0aCB8fCAwLjU7XHJcbiAgICBpbml0aWFsU2NhbGUgPSBpbml0aWFsU2NhbGUgfHwgbmV3IFBoYXNlci5Qb2ludCgxLDEpO1xyXG4gICAgb2JqZWN0LnNjYWxlLnggPSBpbml0aWFsU2NhbGUueCArIChNYXRoLmFicyhvYmplY3QueCAtIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLngpIC8gMTAwKSAqIHN0cmVuZ3RoO1xyXG4gICAgb2JqZWN0LnNjYWxlLnkgPSBpbml0aWFsU2NhbGUueSArIChpbml0aWFsU2NhbGUueSAqIHN0cmVuZ3RoKSAtIChvYmplY3Quc2NhbGUueCAqIHN0cmVuZ3RoKTtcclxufTtcclxuXHJcbi8qKlxyXG4qIFJ1bnMgdGhlIGNvcmUgdXBkYXRlIGZ1bmN0aW9uIGFuZCBjYXVzZXMgc2NyZWVuIHNoYWtlIGFuZCBvdmVyc2NhbGluZyBlZmZlY3RzIHRvIG9jY3VyIGlmIHRoZXkgYXJlIHF1ZXVlZCB0byBkbyBzby5cclxuKlxyXG4qIEBtZXRob2QgUGhhc2VyLlBsdWdpbi5KdWljeSN1cGRhdGVcclxuKiBAbWVtYmVyb2YgUGhhc2VyLlBsdWdpbi5KdWljeVxyXG4qL1xyXG5QaGFzZXIuUGx1Z2luLkp1aWN5LnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHNjYWxlT2JqO1xyXG4gIC8vIFNjcmVlbiBTaGFrZVxyXG4gIGlmKHRoaXMuX3NoYWtlV29ybGRUaW1lID4gMCkgeyBcclxuICAgIHZhciBtYWduaXR1ZGUgPSAodGhpcy5fc2hha2VXb3JsZFRpbWUgLyB0aGlzLl9zaGFrZVdvcmxkTWF4KSAqIHRoaXMuX3NoYWtlV29ybGRNYXg7XHJcbiAgICB2YXIgeCA9IHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoLW1hZ25pdHVkZSwgbWFnbml0dWRlKTtcclxuICAgIHZhciB5ID0gdGhpcy5nYW1lLnJuZC5pbnRlZ2VySW5SYW5nZSgtbWFnbml0dWRlLCBtYWduaXR1ZGUpO1xyXG5cclxuICAgIHRoaXMuZ2FtZS5jYW1lcmEueCA9IHg7XHJcbiAgICB0aGlzLmdhbWUuY2FtZXJhLnkgPSB5O1xyXG4gICAgdGhpcy5fc2hha2VXb3JsZFRpbWUtLTtcclxuICAgIGlmKHRoaXMuX3NoYWtlV29ybGRUaW1lIDw9IDApIHtcclxuICAgICAgdGhpcy5nYW1lLndvcmxkLnNldEJvdW5kcyh0aGlzLl9ib3VuZHNDYWNoZS54LCB0aGlzLl9ib3VuZHNDYWNoZS54LCB0aGlzLl9ib3VuZHNDYWNoZS53aWR0aCwgdGhpcy5fYm91bmRzQ2FjaGUuaGVpZ2h0KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIG92ZXIgc2NhbGVzXHJcbiAgZm9yKHZhciBzIGluIHRoaXMuX292ZXJTY2FsZXMpIHtcclxuICAgIGlmKHRoaXMuX292ZXJTY2FsZXMuaGFzT3duUHJvcGVydHkocykpIHtcclxuICAgICAgc2NhbGVPYmogPSB0aGlzLl9vdmVyU2NhbGVzW3NdO1xyXG4gICAgICBpZihzY2FsZU9iai5zY2FsZSA+IDAuMDEpIHtcclxuICAgICAgICBzY2FsZU9iai5vYmplY3Quc2NhbGUueCA9IHNjYWxlT2JqLnNjYWxlICogc2NhbGVPYmouY2FjaGUueDtcclxuICAgICAgICBzY2FsZU9iai5vYmplY3Quc2NhbGUueSA9IHNjYWxlT2JqLnNjYWxlICogc2NhbGVPYmouY2FjaGUueTtcclxuICAgICAgICBzY2FsZU9iai5zY2FsZSAtPSB0aGlzLmdhbWUudGltZS5lbGFwc2VkICogc2NhbGVPYmouc2NhbGUgKiAwLjM1O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNjYWxlT2JqLm9iamVjdC5zY2FsZS54ID0gc2NhbGVPYmouY2FjaGUueDtcclxuICAgICAgICBzY2FsZU9iai5vYmplY3Quc2NhbGUueSA9IHNjYWxlT2JqLmNhY2hlLnk7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX292ZXJTY2FsZXNbc107XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vLyBmb3IgYnJvd3NlcmlmeSBjb21wYXRpYmlsaXR5XHJcbmlmKG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gIG1vZHVsZS5leHBvcnRzID0gUGhhc2VyLlBsdWdpbi5KdWljeTtcclxufVxyXG5cclxuXHJcblxyXG4vLyBEcmF3IFRyaWFuZ2xlcyBQb2x5ZmlsbCBmb3IgYmFjayBjb21wYXRpYmlsaXR5XHJcbmlmKCFQaGFzZXIuR3JhcGhpY3MucHJvdG90eXBlLmRyYXdUcmlhbmdsZSkge1xyXG4gIFBoYXNlci5HcmFwaGljcy5wcm90b3R5cGUuZHJhd1RyaWFuZ2xlID0gZnVuY3Rpb24ocG9pbnRzLCBjdWxsKSB7XHJcbiAgICAgIHZhciB0cmlhbmdsZSA9IG5ldyBQaGFzZXIuUG9seWdvbihwb2ludHMpO1xyXG4gICAgICBpZiAoY3VsbCkge1xyXG4gICAgICAgICAgdmFyIGNhbWVyYVRvRmFjZSA9IG5ldyBQaGFzZXIuUG9pbnQodGhpcy5nYW1lLmNhbWVyYS54IC0gcG9pbnRzWzBdLngsIHRoaXMuZ2FtZS5jYW1lcmEueSAtIHBvaW50c1swXS55KTtcclxuICAgICAgICAgIHZhciBhYiA9IG5ldyBQaGFzZXIuUG9pbnQocG9pbnRzWzFdLnggLSBwb2ludHNbMF0ueCwgcG9pbnRzWzFdLnkgLSBwb2ludHNbMF0ueSk7XHJcbiAgICAgICAgICB2YXIgY2IgPSBuZXcgUGhhc2VyLlBvaW50KHBvaW50c1sxXS54IC0gcG9pbnRzWzJdLngsIHBvaW50c1sxXS55IC0gcG9pbnRzWzJdLnkpO1xyXG4gICAgICAgICAgdmFyIGZhY2VOb3JtYWwgPSBjYi5jcm9zcyhhYik7XHJcbiAgICAgICAgICBpZiAoY2FtZXJhVG9GYWNlLmRvdChmYWNlTm9ybWFsKSA+IDApIHtcclxuICAgICAgICAgICAgICB0aGlzLmRyYXdQb2x5Z29uKHRyaWFuZ2xlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuZHJhd1BvbHlnb24odHJpYW5nbGUpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICB9O1xyXG5cclxuICAvKlxyXG4gICogRHJhd3Mge1BoYXNlci5Qb2x5Z29ufSB0cmlhbmdsZXMgXHJcbiAgKlxyXG4gICogQHBhcmFtIHtBcnJheTxQaGFzZXIuUG9pbnQ+fEFycmF5PG51bWJlcj59IHZlcnRpY2VzIC0gQW4gYXJyYXkgb2YgUGhhc2VyLlBvaW50cyBvciBudW1iZXJzIHRoYXQgbWFrZSB1cCB0aGUgdmVydGljZXMgb2YgdGhlIHRyaWFuZ2xlc1xyXG4gICogQHBhcmFtIHtBcnJheTxudW1iZXI+fSB7aW5kaWNlcz1udWxsfSAtIEFuIGFycmF5IG9mIG51bWJlcnMgdGhhdCBkZXNjcmliZSB3aGF0IG9yZGVyIHRvIGRyYXcgdGhlIHZlcnRpY2VzIGluXHJcbiAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjdWxsPWZhbHNlXSAtIFNob3VsZCB3ZSBjaGVjayBpZiB0aGUgdHJpYW5nbGUgaXMgYmFjay1mYWNpbmdcclxuICAqIEBtZXRob2QgUGhhc2VyLkdyYXBoaWNzLnByb3RvdHlwZS5kcmF3VHJpYW5nbGVzXHJcbiAgKi9cclxuXHJcbiAgUGhhc2VyLkdyYXBoaWNzLnByb3RvdHlwZS5kcmF3VHJpYW5nbGVzID0gZnVuY3Rpb24odmVydGljZXMsIGluZGljZXMsIGN1bGwpIHtcclxuXHJcbiAgICAgIHZhciBwb2ludDEgPSBuZXcgUGhhc2VyLlBvaW50KCksXHJcbiAgICAgICAgICBwb2ludDIgPSBuZXcgUGhhc2VyLlBvaW50KCksXHJcbiAgICAgICAgICBwb2ludDMgPSBuZXcgUGhhc2VyLlBvaW50KCksXHJcbiAgICAgICAgICBwb2ludHMgPSBbXSxcclxuICAgICAgICAgIGk7XHJcblxyXG4gICAgICBpZiAoIWluZGljZXMpIHtcclxuICAgICAgICAgIGlmKHZlcnRpY2VzWzBdIGluc3RhbmNlb2YgUGhhc2VyLlBvaW50KSB7XHJcbiAgICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgdmVydGljZXMubGVuZ3RoIC8gMzsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1RyaWFuZ2xlKFt2ZXJ0aWNlc1tpICogM10sIHZlcnRpY2VzW2kgKiAzICsgMV0sIHZlcnRpY2VzW2kgKiAzICsgMl1dLCBjdWxsKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB2ZXJ0aWNlcy5sZW5ndGggLyA2OyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgcG9pbnQxLnggPSB2ZXJ0aWNlc1tpICogNiArIDBdO1xyXG4gICAgICAgICAgICAgICAgICBwb2ludDEueSA9IHZlcnRpY2VzW2kgKiA2ICsgMV07XHJcbiAgICAgICAgICAgICAgICAgIHBvaW50Mi54ID0gdmVydGljZXNbaSAqIDYgKyAyXTtcclxuICAgICAgICAgICAgICAgICAgcG9pbnQyLnkgPSB2ZXJ0aWNlc1tpICogNiArIDNdO1xyXG4gICAgICAgICAgICAgICAgICBwb2ludDMueCA9IHZlcnRpY2VzW2kgKiA2ICsgNF07XHJcbiAgICAgICAgICAgICAgICAgIHBvaW50My55ID0gdmVydGljZXNbaSAqIDYgKyA1XTtcclxuICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3VHJpYW5nbGUoW3BvaW50MSwgcG9pbnQyLCBwb2ludDNdLCBjdWxsKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYodmVydGljZXNbMF0gaW5zdGFuY2VvZiBQaGFzZXIuUG9pbnQpIHtcclxuICAgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBpbmRpY2VzLmxlbmd0aCAvMzsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKHZlcnRpY2VzW2luZGljZXNbaSAqIDMgXV0pO1xyXG4gICAgICAgICAgICAgICAgICBwb2ludHMucHVzaCh2ZXJ0aWNlc1tpbmRpY2VzW2kgKiAzICsgMV1dKTtcclxuICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2godmVydGljZXNbaW5kaWNlc1tpICogMyArIDJdXSk7XHJcbiAgICAgICAgICAgICAgICAgIGlmKHBvaW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1RyaWFuZ2xlKHBvaW50cywgY3VsbCk7ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgcG9pbnRzID0gW107XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaW5kaWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICBwb2ludDEueCA9IHZlcnRpY2VzW2luZGljZXNbaV0gKiAyXTtcclxuICAgICAgICAgICAgICAgICAgcG9pbnQxLnkgPSB2ZXJ0aWNlc1tpbmRpY2VzW2ldICogMiArIDFdO1xyXG4gICAgICAgICAgICAgICAgICBwb2ludHMucHVzaChwb2ludDEuY29weVRvKHt9KSk7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwb2ludHMubGVuZ3RoID09PSAzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdUcmlhbmdsZShwb2ludHMsIGN1bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgcG9pbnRzID0gW107XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuICB9O1xyXG59IiwiLy8gICAgIHV1aWQuanNcclxuLy9cclxuLy8gICAgIENvcHlyaWdodCAoYykgMjAxMC0yMDEyIFJvYmVydCBLaWVmZmVyXHJcbi8vICAgICBNSVQgTGljZW5zZSAtIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcclxuXHJcbihmdW5jdGlvbigpIHtcclxuICB2YXIgX2dsb2JhbCA9IHRoaXM7XHJcblxyXG4gIC8vIFVuaXF1ZSBJRCBjcmVhdGlvbiByZXF1aXJlcyBhIGhpZ2ggcXVhbGl0eSByYW5kb20gIyBnZW5lcmF0b3IuICBXZSBmZWF0dXJlXHJcbiAgLy8gZGV0ZWN0IHRvIGRldGVybWluZSB0aGUgYmVzdCBSTkcgc291cmNlLCBub3JtYWxpemluZyB0byBhIGZ1bmN0aW9uIHRoYXRcclxuICAvLyByZXR1cm5zIDEyOC1iaXRzIG9mIHJhbmRvbW5lc3MsIHNpbmNlIHRoYXQncyB3aGF0J3MgdXN1YWxseSByZXF1aXJlZFxyXG4gIHZhciBfcm5nO1xyXG5cclxuICAvLyBOb2RlLmpzIGNyeXB0by1iYXNlZCBSTkcgLSBodHRwOi8vbm9kZWpzLm9yZy9kb2NzL3YwLjYuMi9hcGkvY3J5cHRvLmh0bWxcclxuICAvL1xyXG4gIC8vIE1vZGVyYXRlbHkgZmFzdCwgaGlnaCBxdWFsaXR5XHJcbiAgaWYgKHR5cGVvZihfZ2xvYmFsLnJlcXVpcmUpID09ICdmdW5jdGlvbicpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHZhciBfcmIgPSBfZ2xvYmFsLnJlcXVpcmUoJ2NyeXB0bycpLnJhbmRvbUJ5dGVzO1xyXG4gICAgICBfcm5nID0gX3JiICYmIGZ1bmN0aW9uKCkge3JldHVybiBfcmIoMTYpO307XHJcbiAgICB9IGNhdGNoKGUpIHt9XHJcbiAgfVxyXG5cclxuICBpZiAoIV9ybmcgJiYgX2dsb2JhbC5jcnlwdG8gJiYgY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xyXG4gICAgLy8gV0hBVFdHIGNyeXB0by1iYXNlZCBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXHJcbiAgICAvL1xyXG4gICAgLy8gTW9kZXJhdGVseSBmYXN0LCBoaWdoIHF1YWxpdHlcclxuICAgIHZhciBfcm5kczggPSBuZXcgVWludDhBcnJheSgxNik7XHJcbiAgICBfcm5nID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xyXG4gICAgICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKF9ybmRzOCk7XHJcbiAgICAgIHJldHVybiBfcm5kczg7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgaWYgKCFfcm5nKSB7XHJcbiAgICAvLyBNYXRoLnJhbmRvbSgpLWJhc2VkIChSTkcpXHJcbiAgICAvL1xyXG4gICAgLy8gSWYgYWxsIGVsc2UgZmFpbHMsIHVzZSBNYXRoLnJhbmRvbSgpLiAgSXQncyBmYXN0LCBidXQgaXMgb2YgdW5zcGVjaWZpZWRcclxuICAgIC8vIHF1YWxpdHkuXHJcbiAgICB2YXIgIF9ybmRzID0gbmV3IEFycmF5KDE2KTtcclxuICAgIF9ybmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCAxNjsgaSsrKSB7XHJcbiAgICAgICAgaWYgKChpICYgMHgwMykgPT09IDApIHIgPSBNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwMDA7XHJcbiAgICAgICAgX3JuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBfcm5kcztcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvLyBCdWZmZXIgY2xhc3MgdG8gdXNlXHJcbiAgdmFyIEJ1ZmZlckNsYXNzID0gdHlwZW9mKF9nbG9iYWwuQnVmZmVyKSA9PSAnZnVuY3Rpb24nID8gX2dsb2JhbC5CdWZmZXIgOiBBcnJheTtcclxuXHJcbiAgLy8gTWFwcyBmb3IgbnVtYmVyIDwtPiBoZXggc3RyaW5nIGNvbnZlcnNpb25cclxuICB2YXIgX2J5dGVUb0hleCA9IFtdO1xyXG4gIHZhciBfaGV4VG9CeXRlID0ge307XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xyXG4gICAgX2J5dGVUb0hleFtpXSA9IChpICsgMHgxMDApLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSk7XHJcbiAgICBfaGV4VG9CeXRlW19ieXRlVG9IZXhbaV1dID0gaTtcclxuICB9XHJcblxyXG4gIC8vICoqYHBhcnNlKClgIC0gUGFyc2UgYSBVVUlEIGludG8gaXQncyBjb21wb25lbnQgYnl0ZXMqKlxyXG4gIGZ1bmN0aW9uIHBhcnNlKHMsIGJ1Ziwgb2Zmc2V0KSB7XHJcbiAgICB2YXIgaSA9IChidWYgJiYgb2Zmc2V0KSB8fCAwLCBpaSA9IDA7XHJcblxyXG4gICAgYnVmID0gYnVmIHx8IFtdO1xyXG4gICAgcy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1swLTlhLWZdezJ9L2csIGZ1bmN0aW9uKG9jdCkge1xyXG4gICAgICBpZiAoaWkgPCAxNikgeyAvLyBEb24ndCBvdmVyZmxvdyFcclxuICAgICAgICBidWZbaSArIGlpKytdID0gX2hleFRvQnl0ZVtvY3RdO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBaZXJvIG91dCByZW1haW5pbmcgYnl0ZXMgaWYgc3RyaW5nIHdhcyBzaG9ydFxyXG4gICAgd2hpbGUgKGlpIDwgMTYpIHtcclxuICAgICAgYnVmW2kgKyBpaSsrXSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJ1ZjtcclxuICB9XHJcblxyXG4gIC8vICoqYHVucGFyc2UoKWAgLSBDb252ZXJ0IFVVSUQgYnl0ZSBhcnJheSAoYWxhIHBhcnNlKCkpIGludG8gYSBzdHJpbmcqKlxyXG4gIGZ1bmN0aW9uIHVucGFyc2UoYnVmLCBvZmZzZXQpIHtcclxuICAgIHZhciBpID0gb2Zmc2V0IHx8IDAsIGJ0aCA9IF9ieXRlVG9IZXg7XHJcbiAgICByZXR1cm4gIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcclxuICAgICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xyXG4gICAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXHJcbiAgICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcclxuICAgICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xyXG4gICAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXHJcbiAgICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcclxuICAgICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV07XHJcbiAgfVxyXG5cclxuICAvLyAqKmB2MSgpYCAtIEdlbmVyYXRlIHRpbWUtYmFzZWQgVVVJRCoqXHJcbiAgLy9cclxuICAvLyBJbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vTGlvc0svVVVJRC5qc1xyXG4gIC8vIGFuZCBodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvdXVpZC5odG1sXHJcblxyXG4gIC8vIHJhbmRvbSAjJ3Mgd2UgbmVlZCB0byBpbml0IG5vZGUgYW5kIGNsb2Nrc2VxXHJcbiAgdmFyIF9zZWVkQnl0ZXMgPSBfcm5nKCk7XHJcblxyXG4gIC8vIFBlciA0LjUsIGNyZWF0ZSBhbmQgNDgtYml0IG5vZGUgaWQsICg0NyByYW5kb20gYml0cyArIG11bHRpY2FzdCBiaXQgPSAxKVxyXG4gIHZhciBfbm9kZUlkID0gW1xyXG4gICAgX3NlZWRCeXRlc1swXSB8IDB4MDEsXHJcbiAgICBfc2VlZEJ5dGVzWzFdLCBfc2VlZEJ5dGVzWzJdLCBfc2VlZEJ5dGVzWzNdLCBfc2VlZEJ5dGVzWzRdLCBfc2VlZEJ5dGVzWzVdXHJcbiAgXTtcclxuXHJcbiAgLy8gUGVyIDQuMi4yLCByYW5kb21pemUgKDE0IGJpdCkgY2xvY2tzZXFcclxuICB2YXIgX2Nsb2Nrc2VxID0gKF9zZWVkQnl0ZXNbNl0gPDwgOCB8IF9zZWVkQnl0ZXNbN10pICYgMHgzZmZmO1xyXG5cclxuICAvLyBQcmV2aW91cyB1dWlkIGNyZWF0aW9uIHRpbWVcclxuICB2YXIgX2xhc3RNU2VjcyA9IDAsIF9sYXN0TlNlY3MgPSAwO1xyXG5cclxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Jyb29mYS9ub2RlLXV1aWQgZm9yIEFQSSBkZXRhaWxzXHJcbiAgZnVuY3Rpb24gdjEob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcclxuICAgIHZhciBpID0gYnVmICYmIG9mZnNldCB8fCAwO1xyXG4gICAgdmFyIGIgPSBidWYgfHwgW107XHJcblxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgdmFyIGNsb2Nrc2VxID0gb3B0aW9ucy5jbG9ja3NlcSAhPSBudWxsID8gb3B0aW9ucy5jbG9ja3NlcSA6IF9jbG9ja3NlcTtcclxuXHJcbiAgICAvLyBVVUlEIHRpbWVzdGFtcHMgYXJlIDEwMCBuYW5vLXNlY29uZCB1bml0cyBzaW5jZSB0aGUgR3JlZ29yaWFuIGVwb2NoLFxyXG4gICAgLy8gKDE1ODItMTAtMTUgMDA6MDApLiAgSlNOdW1iZXJzIGFyZW4ndCBwcmVjaXNlIGVub3VnaCBmb3IgdGhpcywgc29cclxuICAgIC8vIHRpbWUgaXMgaGFuZGxlZCBpbnRlcm5hbGx5IGFzICdtc2VjcycgKGludGVnZXIgbWlsbGlzZWNvbmRzKSBhbmQgJ25zZWNzJ1xyXG4gICAgLy8gKDEwMC1uYW5vc2Vjb25kcyBvZmZzZXQgZnJvbSBtc2Vjcykgc2luY2UgdW5peCBlcG9jaCwgMTk3MC0wMS0wMSAwMDowMC5cclxuICAgIHZhciBtc2VjcyA9IG9wdGlvbnMubXNlY3MgIT0gbnVsbCA/IG9wdGlvbnMubXNlY3MgOiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAvLyBQZXIgNC4yLjEuMiwgdXNlIGNvdW50IG9mIHV1aWQncyBnZW5lcmF0ZWQgZHVyaW5nIHRoZSBjdXJyZW50IGNsb2NrXHJcbiAgICAvLyBjeWNsZSB0byBzaW11bGF0ZSBoaWdoZXIgcmVzb2x1dGlvbiBjbG9ja1xyXG4gICAgdmFyIG5zZWNzID0gb3B0aW9ucy5uc2VjcyAhPSBudWxsID8gb3B0aW9ucy5uc2VjcyA6IF9sYXN0TlNlY3MgKyAxO1xyXG5cclxuICAgIC8vIFRpbWUgc2luY2UgbGFzdCB1dWlkIGNyZWF0aW9uIChpbiBtc2VjcylcclxuICAgIHZhciBkdCA9IChtc2VjcyAtIF9sYXN0TVNlY3MpICsgKG5zZWNzIC0gX2xhc3ROU2VjcykvMTAwMDA7XHJcblxyXG4gICAgLy8gUGVyIDQuMi4xLjIsIEJ1bXAgY2xvY2tzZXEgb24gY2xvY2sgcmVncmVzc2lvblxyXG4gICAgaWYgKGR0IDwgMCAmJiBvcHRpb25zLmNsb2Nrc2VxID09IG51bGwpIHtcclxuICAgICAgY2xvY2tzZXEgPSBjbG9ja3NlcSArIDEgJiAweDNmZmY7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVzZXQgbnNlY3MgaWYgY2xvY2sgcmVncmVzc2VzIChuZXcgY2xvY2tzZXEpIG9yIHdlJ3ZlIG1vdmVkIG9udG8gYSBuZXdcclxuICAgIC8vIHRpbWUgaW50ZXJ2YWxcclxuICAgIGlmICgoZHQgPCAwIHx8IG1zZWNzID4gX2xhc3RNU2VjcykgJiYgb3B0aW9ucy5uc2VjcyA9PSBudWxsKSB7XHJcbiAgICAgIG5zZWNzID0gMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBQZXIgNC4yLjEuMiBUaHJvdyBlcnJvciBpZiB0b28gbWFueSB1dWlkcyBhcmUgcmVxdWVzdGVkXHJcbiAgICBpZiAobnNlY3MgPj0gMTAwMDApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1dWlkLnYxKCk6IENhblxcJ3QgY3JlYXRlIG1vcmUgdGhhbiAxME0gdXVpZHMvc2VjJyk7XHJcbiAgICB9XHJcblxyXG4gICAgX2xhc3RNU2VjcyA9IG1zZWNzO1xyXG4gICAgX2xhc3ROU2VjcyA9IG5zZWNzO1xyXG4gICAgX2Nsb2Nrc2VxID0gY2xvY2tzZXE7XHJcblxyXG4gICAgLy8gUGVyIDQuMS40IC0gQ29udmVydCBmcm9tIHVuaXggZXBvY2ggdG8gR3JlZ29yaWFuIGVwb2NoXHJcbiAgICBtc2VjcyArPSAxMjIxOTI5MjgwMDAwMDtcclxuXHJcbiAgICAvLyBgdGltZV9sb3dgXHJcbiAgICB2YXIgdGwgPSAoKG1zZWNzICYgMHhmZmZmZmZmKSAqIDEwMDAwICsgbnNlY3MpICUgMHgxMDAwMDAwMDA7XHJcbiAgICBiW2krK10gPSB0bCA+Pj4gMjQgJiAweGZmO1xyXG4gICAgYltpKytdID0gdGwgPj4+IDE2ICYgMHhmZjtcclxuICAgIGJbaSsrXSA9IHRsID4+PiA4ICYgMHhmZjtcclxuICAgIGJbaSsrXSA9IHRsICYgMHhmZjtcclxuXHJcbiAgICAvLyBgdGltZV9taWRgXHJcbiAgICB2YXIgdG1oID0gKG1zZWNzIC8gMHgxMDAwMDAwMDAgKiAxMDAwMCkgJiAweGZmZmZmZmY7XHJcbiAgICBiW2krK10gPSB0bWggPj4+IDggJiAweGZmO1xyXG4gICAgYltpKytdID0gdG1oICYgMHhmZjtcclxuXHJcbiAgICAvLyBgdGltZV9oaWdoX2FuZF92ZXJzaW9uYFxyXG4gICAgYltpKytdID0gdG1oID4+PiAyNCAmIDB4ZiB8IDB4MTA7IC8vIGluY2x1ZGUgdmVyc2lvblxyXG4gICAgYltpKytdID0gdG1oID4+PiAxNiAmIDB4ZmY7XHJcblxyXG4gICAgLy8gYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgIChQZXIgNC4yLjIgLSBpbmNsdWRlIHZhcmlhbnQpXHJcbiAgICBiW2krK10gPSBjbG9ja3NlcSA+Pj4gOCB8IDB4ODA7XHJcblxyXG4gICAgLy8gYGNsb2NrX3NlcV9sb3dgXHJcbiAgICBiW2krK10gPSBjbG9ja3NlcSAmIDB4ZmY7XHJcblxyXG4gICAgLy8gYG5vZGVgXHJcbiAgICB2YXIgbm9kZSA9IG9wdGlvbnMubm9kZSB8fCBfbm9kZUlkO1xyXG4gICAgZm9yICh2YXIgbiA9IDA7IG4gPCA2OyBuKyspIHtcclxuICAgICAgYltpICsgbl0gPSBub2RlW25dO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBidWYgPyBidWYgOiB1bnBhcnNlKGIpO1xyXG4gIH1cclxuXHJcbiAgLy8gKipgdjQoKWAgLSBHZW5lcmF0ZSByYW5kb20gVVVJRCoqXHJcblxyXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYnJvb2ZhL25vZGUtdXVpZCBmb3IgQVBJIGRldGFpbHNcclxuICBmdW5jdGlvbiB2NChvcHRpb25zLCBidWYsIG9mZnNldCkge1xyXG4gICAgLy8gRGVwcmVjYXRlZCAtICdmb3JtYXQnIGFyZ3VtZW50LCBhcyBzdXBwb3J0ZWQgaW4gdjEuMlxyXG4gICAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XHJcblxyXG4gICAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSAnc3RyaW5nJykge1xyXG4gICAgICBidWYgPSBvcHRpb25zID09ICdiaW5hcnknID8gbmV3IEJ1ZmZlckNsYXNzKDE2KSA6IG51bGw7XHJcbiAgICAgIG9wdGlvbnMgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgdmFyIHJuZHMgPSBvcHRpb25zLnJhbmRvbSB8fCAob3B0aW9ucy5ybmcgfHwgX3JuZykoKTtcclxuXHJcbiAgICAvLyBQZXIgNC40LCBzZXQgYml0cyBmb3IgdmVyc2lvbiBhbmQgYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgXHJcbiAgICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XHJcbiAgICBybmRzWzhdID0gKHJuZHNbOF0gJiAweDNmKSB8IDB4ODA7XHJcblxyXG4gICAgLy8gQ29weSBieXRlcyB0byBidWZmZXIsIGlmIHByb3ZpZGVkXHJcbiAgICBpZiAoYnVmKSB7XHJcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgaWkrKykge1xyXG4gICAgICAgIGJ1ZltpICsgaWldID0gcm5kc1tpaV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYnVmIHx8IHVucGFyc2Uocm5kcyk7XHJcbiAgfVxyXG5cclxuICAvLyBFeHBvcnQgcHVibGljIEFQSVxyXG4gIHZhciB1dWlkID0gdjQ7XHJcbiAgdXVpZC52MSA9IHYxO1xyXG4gIHV1aWQudjQgPSB2NDtcclxuICB1dWlkLnBhcnNlID0gcGFyc2U7XHJcbiAgdXVpZC51bnBhcnNlID0gdW5wYXJzZTtcclxuICB1dWlkLkJ1ZmZlckNsYXNzID0gQnVmZmVyQ2xhc3M7XHJcblxyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgIC8vIFB1Ymxpc2ggYXMgQU1EIG1vZHVsZVxyXG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge3JldHVybiB1dWlkO30pO1xyXG4gIH0gZWxzZSBpZiAodHlwZW9mKG1vZHVsZSkgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIC8vIFB1Ymxpc2ggYXMgbm9kZS5qcyBtb2R1bGVcclxuICAgIG1vZHVsZS5leHBvcnRzID0gdXVpZDtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gUHVibGlzaCBhcyBnbG9iYWwgKGluIGJyb3dzZXJzKVxyXG4gICAgdmFyIF9wcmV2aW91c1Jvb3QgPSBfZ2xvYmFsLnV1aWQ7XHJcblxyXG4gICAgLy8gKipgbm9Db25mbGljdCgpYCAtIChicm93c2VyIG9ubHkpIHRvIHJlc2V0IGdsb2JhbCAndXVpZCcgdmFyKipcclxuICAgIHV1aWQubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICBfZ2xvYmFsLnV1aWQgPSBfcHJldmlvdXNSb290O1xyXG4gICAgICByZXR1cm4gdXVpZDtcclxuICAgIH07XHJcblxyXG4gICAgX2dsb2JhbC51dWlkID0gdXVpZDtcclxuICB9XHJcbn0pLmNhbGwodGhpcyk7IiwibW9kdWxlLmV4cG9ydHMgPVxyXG4oZnVuY3Rpb24oZWxlLCBzY29wZSwgc29ja2V0LCBtYXBzLCBtYXBJZCwgaW5qZWN0b3IpIHtcclxuXHJcbiAgLy8gUmVxdWlyZSBsaWJcclxuICByZXF1aXJlKCcuL2xpYi9qdWljeScpO1xyXG4gIHZhciBVVUlEID0gcmVxdWlyZSgnLi9saWIvdXVpZCcpO1xyXG4gIFxyXG4gIHZhciBoZWlnaHQgID0gcGFyc2VJbnQoZWxlLmNzcygnaGVpZ2h0JyksIDEwKSxcclxuICAgICAgd2lkdGggICA9IHBhcnNlSW50KGVsZS5jc3MoJ3dpZHRoJyksIDEwKTtcclxuICB2YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSh3aWR0aCwgaGVpZ2h0LCBQaGFzZXIuQVVUTywgJ2dhbWUtY2FudmFzJyk7XHJcblxyXG4gIHZhciBHYW1lICAgID0gcmVxdWlyZSgnLi9zdGF0ZXMnKSxcclxuICAgICAgc3RhdGVzICA9IEdhbWUuU3RhdGVzO1xyXG5cclxuICBnYW1lLnN0YXRlLmFkZCgnQm9vdCcsIHN0YXRlcy5Cb290KTtcclxuICBnYW1lLnN0YXRlLmFkZCgnUHJlbG9hZGVyJywgc3RhdGVzLlByZWxvYWRlcik7XHJcbiAgZ2FtZS5zdGF0ZS5hZGQoJ01haW5NZW51Jywgc3RhdGVzLk1haW5NZW51KTtcclxuICBnYW1lLnN0YXRlLmFkZCgnUGxheScsIHN0YXRlcy5QbGF5KTtcclxuICAvLyBnYW1lLnN0YXRlLmFkZCgnR2FtZScsIHJlcXVpcmUoJy4vc3RhdGVzL2dhbWUnKSk7XHJcbiAgLy8gZ2FtZS5zdGF0ZS5hZGQoJ05leHRMZXZlbCcsIHJlcXVpcmUoJy4vc3RhdGVzL25leHRfbGV2ZWwnKSk7XHJcbiAgZ2FtZS5zdGF0ZS5hZGQoJ0dhbWVPdmVyJywgc3RhdGVzLkdhbWVPdmVyKTtcclxuXHJcbiAgZ2FtZS5tYXBJZCA9IG1hcElkO1xyXG4gIGdhbWUuc29ja2V0ID0gc29ja2V0O1xyXG4gIGdhbWUuc2NvcGUgID0gc2NvcGU7XHJcbiAgR2FtZS5tYXBzICAgICAgICAgICA9IG1hcHM7XHJcbiAgR2FtZS5yZW1vdGVQbGF5ZXJzID0gW107XHJcblxyXG4gIHZhciB1c2VyICA9IGluamVjdG9yLmdldCgnVXNlcicpLFxyXG4gICAgICBnICAgICA9IEdhbWU7XHJcblxyXG4gIGcuc29ja2V0ICAgICAgICA9IHNvY2tldDtcclxuICBnLm1hcElkICAgICAgICAgPSBtYXBJZDtcclxuICBnLmN1cnJlbnRQbGF5ZXIgPSB1c2VyLmdldEN1cnJlbnRVc2VyKCk7XHJcblxyXG4gIC8vIFR1cm4gb2ZmIG11c2ljXHJcbiAgc2NvcGUuJG9uKCdnYW1lOnRvZ2dsZU11c2ljJywgZnVuY3Rpb24oKSB7XHJcbiAgICBnYW1lLnN0YXRlLnN0YXRlcy5QcmVsb2FkZXIudG9nZ2xlTXVzaWMoKTtcclxuICB9KTtcclxuXHJcbiAgLy8gQ2xlYW51cFxyXG4gIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgIHNvY2tldC5lbWl0KCdwbGF5ZXJMZWZ0TWFwJywge1xyXG4gICAgICBwbGF5ZXJJZDogZy5zaWQsXHJcbiAgICAgIG1hcElkOiBnLm1hcElkXHJcbiAgICB9KTtcclxuICAgIGdhbWUuZGVzdHJveSgpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBOZXR3b3JrIHNvY2tldCBldmVudHNcclxuICBHYW1lLmNvbm5lY3RlZCA9IHRydWU7XHJcbiAgY29uc29sZS5sb2coJ2Nvbm5lY3RlZCBkYXRhIGRhdGEnLCBzb2NrZXQsIGcuY3VycmVudFBsYXllcik7XHJcbiAgLy8gZy5zaWQgICAgID0gZGF0YS5pZDtcclxuICBnLnBsYXllck5hbWUgPSAnQXJpJztcclxuICAvLyBnLnBsYXllck5hbWUgPSBwcm9tcHQoXCJQbGVhc2UgZW50ZXIgeW91ciBuYW1lXCIpIHx8ICdQbGF5ZXInO1xyXG4gIGcuc29ja2V0LmVtaXQoJ3NldFBsYXllck5hbWUnLCB7IG5hbWU6IGcucGxheWVyTmFtZSB9KTtcclxuXHJcbiAgZy5zb2NrZXQub24oJ3BsYXllckRldGFpbHMnLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICBnLnNpZCA9IGRhdGEuaWQ7XHJcbiAgICBjb25zb2xlLmxvZygnR0FNRSBHQU1FJywgZ2FtZSk7XHJcbiAgICBnYW1lLnN0YXRlLnN0YXJ0KCdCb290Jyk7XHJcbiAgfSk7XHJcblxyXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XHJcblxyXG4gIEdhbWUuU3RhdGVzLkJvb3QgPSBmdW5jdGlvbihnYW1lKSB7fTtcclxuXHJcbiAgR2FtZS5TdGF0ZXMuQm9vdC5wcm90b3R5cGUgPSB7XHJcbiAgICByZXNpemVDYW52YXNUb0NvbnRhaW5lckVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgY2FudmFzID0gdGhpcy5nYW1lLmNhbnZhcztcclxuXHJcbiAgICAgIHZhciBjYW52YXMgICAgICAgICAgPSB0aGlzLmdhbWUuY2FudmFzLFxyXG4gICAgICAgICAgY29udGFpbmVyV2lkdGggID0gY2FudmFzLmNsaWVudFdpZHRoLFxyXG4gICAgICAgICAgY29udGFpbmVySGVpZ2h0ID0gY2FudmFzLmNsaWVudEhlaWdodDtcclxuXHJcbiAgICAgIHZhciB4U2NhbGUgPSBjb250YWluZXJXaWR0aCAvIHRoaXMud2lkdGg7XHJcbiAgICAgIHZhciB5U2NhbGUgPSBjb250YWluZXJIZWlnaHQgLyB0aGlzLmhlaWdodDtcclxuICAgICAgdmFyIG5ld1NjYWxlID0gTWF0aC5taW4oIHhTY2FsZSwgeVNjYWxlICk7XHJcblxyXG4gICAgICB0aGlzLnNjYWxlLndpZHRoID0gbmV3U2NhbGUgKiB0aGlzLmdhbWUud2lkdGg7XHJcbiAgICAgIHRoaXMuc2NhbGUuaGVpZ2h0ID0gbmV3U2NhbGUgKiB0aGlzLmdhbWUuaGVpZ2h0O1xyXG4gICAgICB0aGlzLnNjYWxlLnNldFNpemUoY29udGFpbmVyV2lkdGgsIGNvbnRhaW5lckhlaWdodCk7XHJcblxyXG4gICAgICBHYW1lLndpZHRoICA9IHRoaXMuZ2FtZS53aWR0aDtcclxuICAgICAgR2FtZS5oZWlnaHQgPSB0aGlzLmdhbWUuaGVpZ2h0O1xyXG4gICAgfSxcclxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdGhpcy5pbnB1dC5tYXhQb2ludGVycyA9IDE7XHJcbiAgICAgIHRoaXMuc3RhZ2UuZGlzYWJsZVZpc2liaWxpdHlDaGFuZ2UgPSB0cnVlO1xyXG5cclxuICAgICAgaWYgKHRoaXMuZ2FtZS5kZXZpY2UuZGVza3RvcCkge1xyXG4gICAgICAgIHRoaXMuc2NhbGUuc2NhbGVNb2RlID0gUGhhc2VyLlNjYWxlTWFuYWdlci5TSE9XX0FMTDtcclxuICAgICAgICAvLyB0aGlzLnNjYWxlLnNldE1pbk1heCg0ODAsIDI2MCwgMjA0OCwgMTUzNik7XHJcbiAgICAgICAgLy8gdGhpcy5zY2FsZS5wYWdlQWxpZ25Ib3Jpem9udGFsbHkgPSB0cnVlO1xyXG4gICAgICAgIC8vIHRoaXMuc2NhbGUucGFnZUFsaWduVmVydGljYWxseSA9IHRydWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5nYW1lLnN0YWdlLnNjYWxlTW9kZSA9IFBoYXNlci5TY2FsZU1hbmFnZXIuU0hPV19BTEw7XHJcbiAgICAgICAgdGhpcy5nYW1lLnN0YWdlLnNjYWxlLm1pbldpZHRoID0gIDQ4MDtcclxuICAgICAgICB0aGlzLmdhbWUuc3RhZ2Uuc2NhbGUubWluSGVpZ2h0ID0gMjYwO1xyXG4gICAgICAgIHRoaXMuZ2FtZS5zdGFnZS5zY2FsZS5tYXhXaWR0aCA9IDY0MDtcclxuICAgICAgICB0aGlzLmdhbWUuc3RhZ2Uuc2NhbGUubWF4SGVpZ2h0ID0gNDgwO1xyXG4gICAgICAgIHRoaXMuZ2FtZS5zdGFnZS5zY2FsZS5mb3JjZUxhbmRzY2FwZSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5nYW1lLnN0YWdlLnNjYWxlLnBhZ2VBbGlnbkhvcml6b250YWxseSA9IHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuc2NhbGUuc2V0UmVzaXplQ2FsbGJhY2sodGhpcy5oYW5kbGVSZXNpemVFdmVudCwgdGhpcyk7XHJcblxyXG4gICAgICB0aGlzLnNjYWxlLnNldFNjcmVlblNpemUodHJ1ZSk7XHJcbiAgICAgIHRoaXMuc2NhbGUucmVmcmVzaCgpO1xyXG4gICAgfSxcclxuICAgIHByZWxvYWQ6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgLy8gIEhlcmUgd2UgbG9hZCB0aGUgYXNzZXRzIHJlcXVpcmVkIGZvciBvdXIgcHJlbG9hZGVyIChpbiB0aGlzIGNhc2UgYSBiYWNrZ3JvdW5kIGFuZCBhIGxvYWRpbmcgYmFyKVxyXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ21lbnVfYmFja2dyb3VuZCcsICdhc3NldHMvbWVudV9iYWNrZ3JvdW5kLmpwZycpO1xyXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ3ByZWxvYWRlcicsICdhc3NldHMvcHJlbG9hZGVyLmdpZicpO1xyXG4gICAgICB0aGlzLmxvYWQuanNvbignbGV2ZWxzJywgJ2Fzc2V0cy9sZXZlbHMuanNvbicpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmICh0aGlzLmdhbWUuZGV2aWNlLmRlc2t0b3ApIHtcclxuICAgICAgIHRoaXMuc2NhbGUuc2NhbGVNb2RlID0gUGhhc2VyLlNjYWxlTWFuYWdlci5TSE9XX0FMTDsgLy9hbHdheXMgc2hvdyB3aG9sZSBnYW1lXHJcbiAgICAgICAgdGhpcy5nYW1lLnN0YWdlLnNjYWxlLnBhZ2VBbGlnbkhvcml6b250YWxseSA9IHRydWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zY2FsZS5zY2FsZU1vZGUgPSBQaGFzZXIuU2NhbGVNYW5hZ2VyLlNIT1dfQUxMO1xyXG4gICAgICAgIHRoaXMuc2NhbGUuZm9yY2VMYW5kc2NhcGUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnNjYWxlLnBhZ2VBbGlnbkhvcml6b250YWxseSA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5yZXNpemVDYW52YXNUb0NvbnRhaW5lckVsZW1lbnQoKTtcclxuICAgICAgR2FtZS5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgIHRoaXMuc3RhdGUuc3RhcnQoJ1ByZWxvYWRlcicpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVSZXNpemVFdmVudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVzaXplQ2FudmFzVG9Db250YWluZXJFbGVtZW50KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oR2FtZSkge1xyXG5cclxuICBHYW1lLlN0YXRlcy5HYW1lT3ZlciA9IGZ1bmN0aW9uKGdhbWUpIHtcclxuXHJcbiAgfTtcclxuXHJcbiAgR2FtZS5TdGF0ZXMuR2FtZU92ZXIucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKEdhbWUubXVsdGlwbGF5ZXIpIHtcclxuICAgICAgLy8gR2FtZW92ZXIgcGFuZWxcclxuICAgICAgdGhpcy5nYW1lb3ZlclBhbmVsID0gbmV3IEdhbWUuUHJlZmFicy5HYW1lb3ZlclBhbmVsKHRoaXMuZ2FtZSk7XHJcbiAgICAgIHRoaXMuZ2FtZS5hZGQuZXhpc3RpbmcodGhpcy5nYW1lb3ZlclBhbmVsKTtcclxuXHJcbiAgICAgIHRoaXMuZ2FtZW92ZXJQYW5lbC5zaG93KEdhbWUuc2NvcmUpO1xyXG4gICAgfVxyXG4gIH07XHJcbn0pOyIsInZhciBHYW1lID0ge1xyXG4gIG5hbWU6ICduZy1pbnZhZGVyJyxcclxuICAvLyBTdGF0ZXMgb2Ygb3VyIGdhbWVcclxuICBTdGF0ZXM6IHt9LFxyXG4gIC8vIFByZWZhYnNcclxuICBQcmVmYWJzOiB7fSxcclxuICAvLyBMZXZlbHNcclxuICBMZXZlbHM6IHt9LFxyXG5cclxuICBvcmllbnRhdGVkOiB0cnVlLFxyXG5cclxuICBiYWNrZ3JvdW5kWDogMCxcclxuICBiYWNrZ3JvdW5kWTogMCxcclxuXHJcbiAgcGF1c2VkOiB0cnVlLFxyXG5cclxuICBtdWx0aXBsYXllcjogdHJ1ZSxcclxuXHJcbiAgLy8gTWFwXHJcbiAgbWFwRGF0YToge30sXHJcblxyXG4gIC8vIFNvY2tldFxyXG4gIHNvY2tldDoge30sXHJcbiAgcmVtb3RlUGxheWVyczogW10sXHJcbiAgdG9BZGQ6IFtdLFxyXG4gIHRvUmVtb3ZlOiBbXSxcclxuICBsYXRlbmN5OiAwLFxyXG5cclxuICB3aWR0aDogODAwLFxyXG4gIGhlaWdodDogNjAwLFxyXG5cclxuICAvLyBIZWxwZXJzXHJcbiAgY3BjOiBmdW5jdGlvbih4KSB7XHJcbiAgICByZXR1cm4geCAqIDY0ICsgMzI7XHJcbiAgfSxcclxuXHJcbiAgcGxheWVyQnlJZDogZnVuY3Rpb24oaWQpIHtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yZW1vdGVQbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmICh0aGlzLnJlbW90ZVBsYXllcnNbaV0uaWQgPT09IGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3RlUGxheWVyc1tpXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0sXHJcblxyXG4gIHJlc2V0Q2FsbGJhY2tzOiBbXSxcclxuICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICBfLm1hcChHYW1lLnJlc2V0Q2FsbGJhY2tzLCBmdW5jdGlvbihpLHYpIHtcclxuICAgICAgR2FtZS5yZXNldENhbGxiYWNrc1tpXS5hcHBseSh0aGlzKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIHdpbm5lcjogZmFsc2VcclxufTtcclxuXHJcbnJlcXVpcmUoJy4uL2VudGl0aWVzJykoR2FtZSk7XHJcblxyXG5yZXF1aXJlKCcuL2Jvb3QnKShHYW1lKTtcclxucmVxdWlyZSgnLi9wcmVsb2FkZXInKShHYW1lKTtcclxucmVxdWlyZSgnLi9tYWlubWVudScpKEdhbWUpO1xyXG5yZXF1aXJlKCcuL3BsYXknKShHYW1lKTtcclxucmVxdWlyZSgnLi9nYW1lX292ZXInKShHYW1lKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR2FtZTsiLCIvKlxyXG4gKiBUaGUgTWFpbk1lbnUgc3RhdGUgaXMgcmVzcG9uc2libGUgZm9yIHNob3dpbmcgdGhlXHJcbiAqIG1haW4gbWVudSBvZiB0aGUgZ2FtZS4gXHJcbiAqIFxyXG4gKiBUaGUgbWFpbiBtZW51IGhhcyBhIHNjcm9sbGluZyBiYWNrZ3JvdW5kIHdpdGggdHdvIG9wdGlvbnNcclxuICogb2YgbmV3IHNvbG8gZ2FtZSBvciBuZXcgbXVsdGlwbGF5ZXIgZ2FtZS4gVGhlIGRpZmZlcmVuY2VcclxuICogYmV0d2VlbiB0aGUgdHdvIGlzIHRoYXQgYEdhbWUubXVsdGlwbGF5ZXJgIGlzIHNldCB0byB0cnVlXHJcbiAqIG9uIHRoZSBuZXcgbXVsaXRwbGF5ZXIgb3B0aW9uLiBcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKEdhbWUpIHtcclxuICBHYW1lLlN0YXRlcy5NYWluTWVudSA9IGZ1bmN0aW9uKGdhbWUpIHtcclxuICAgIHRoaXMuanVpY3k7XHJcbiAgICB0aGlzLnNjcmVlbkZsYXNoO1xyXG4gIH1cclxuXHJcbiAgR2FtZS5TdGF0ZXMuTWFpbk1lbnUucHJvdG90eXBlID0ge1xyXG4gICAgY3JlYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBnYW1lID0gdGhpcy5nYW1lO1xyXG5cclxuICAgICAgdGhpcy5zdGFydFRpbWUgPSBnYW1lLnRpbWUubm93O1xyXG4gICAgICBcclxuICAgICAgdmFyIGltYWdlID0gdGhpcy5nYW1lLmNhY2hlLmdldEltYWdlKCdsb2dvJyksXHJcbiAgICAgICAgY2VudGVyWCA9IHRoaXMud29ybGQuY2VudGVyWCxcclxuICAgICAgICBjZW50ZXJZID0gdGhpcy53b3JsZC5jZW50ZXJZIC0gaW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAgIGVuZFkgICAgPSB0aGlzLndvcmxkLmhlaWdodCArIGltYWdlLmhlaWdodCxcclxuICAgICAgICB0ZXh0UGFkZGluZyA9IHRoaXMuZ2FtZS5kZXZpY2UuZGVza3RvcCA/IDYwIDogMzA7XHJcblxyXG4gICAgICAvLyBNZW51IGJhY2tncm91bmRcclxuICAgICAgdGhpcy5iYWNrZ3JvdW5kID0gZ2FtZS5hZGQudGlsZVNwcml0ZSgwLCAwLCB0aGlzLndvcmxkLndpZHRoLCB0aGlzLndvcmxkLmhlaWdodCwgJ21lbnVfYmFja2dyb3VuZCcpO1xyXG4gICAgICB0aGlzLmJhY2tncm91bmQuYXV0b1Njcm9sbCgtNTAsIC0yMCk7XHJcbiAgICAgIHRoaXMuYmFja2dyb3VuZC50aWxlUG9zaXRpb24ueCA9IDA7XHJcbiAgICAgIHRoaXMuYmFja2dyb3VuZC50aWxlUG9zaXRpb24ueSA9IDA7XHJcblxyXG4gICAgICAvLyBBZGQgbG9nb1xyXG4gICAgICB2YXIgc3ByaXRlID0gZ2FtZS5hZGQuc3ByaXRlKGNlbnRlclgsIGNlbnRlclkgLSB0ZXh0UGFkZGluZywgJ2xvZ28nKTtcclxuICAgICAgc3ByaXRlLmFuY2hvci5zZXQoMC41KTtcclxuXHJcbiAgICAgIGlmICh0aGlzLmdhbWUuZGV2aWNlLmRlc2t0b3ApIHtcclxuICAgICAgICBzcHJpdGUuc2NhbGUuc2V0KDIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBZGQgbmV3IGdhbWVcclxuICAgICAgdmFyIGZvbnRTaXplID0gKHRoaXMuZ2FtZS5kZXZpY2UuZGVza3RvcCA/ICc0MHB4JyA6ICcyMHB4Jyk7XHJcbiAgICAgIHZhciBuZXdHYW1lID0gdGhpcy5uZXdHYW1lID0gdGhpcy5hZGQudGV4dCh0aGlzLndvcmxkLmNlbnRlclgsIFxyXG4gICAgICAgIGNlbnRlclkgKyB0ZXh0UGFkZGluZyxcclxuICAgICAgICBcIk5ldyBnYW1lXCIsIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZvbnQ6IGZvbnRTaXplICsgXCIgQXJjaGl0ZWN0cyBEYXVnaHRlclwiLCBcclxuICAgICAgICAgIGFsaWduOlwiY2VudGVyXCIsIFxyXG4gICAgICAgICAgZmlsbDpcIiNmZmZcIlxyXG4gICAgICAgIH0pOyBcclxuICAgICAgbmV3R2FtZS5pbnB1dEVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICBuZXdHYW1lLmFuY2hvci5zZXQoMC41KTtcclxuXHJcbiAgICAgIG5ld0dhbWUuZXZlbnRzLm9uSW5wdXRPdmVyLmFkZCh0aGlzLm92ZXJOZXdnYW1lLCB0aGlzKTtcclxuICAgICAgbmV3R2FtZS5ldmVudHMub25JbnB1dE91dC5hZGQodGhpcy5vdXROZXdnYW1lLCB0aGlzKTtcclxuICAgICAgbmV3R2FtZS5ldmVudHMub25JbnB1dERvd24uYWRkKHRoaXMucGxheUdhbWUsIHRoaXMpO1xyXG5cclxuICAgICAgdmFyIG11bHRpR2FtZSA9IHRoaXMubXVsdGlHYW1lID0gXHJcbiAgICAgICAgdGhpcy5hZGQudGV4dCh0aGlzLndvcmxkLmNlbnRlclgsIFxyXG4gICAgICAgICAgY2VudGVyWSArIHRleHRQYWRkaW5nICsgbmV3R2FtZS5oZWlnaHQsXHJcbiAgICAgICAgXCJOZXcgbXVsdGlwbGF5ZXIgZ2FtZVwiLCBcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmb250OiBmb250U2l6ZSArIFwiIEFyY2hpdGVjdHMgRGF1Z2h0ZXJcIiwgXHJcbiAgICAgICAgICBhbGlnbjpcImNlbnRlclwiLCBcclxuICAgICAgICAgIGZpbGw6XCIjZmZmXCJcclxuICAgICAgICB9KTsgXHJcbiAgICAgIG11bHRpR2FtZS5pbnB1dEVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICBtdWx0aUdhbWUuYW5jaG9yLnNldCgwLjUpO1xyXG5cclxuICAgICAgbXVsdGlHYW1lLmV2ZW50cy5vbklucHV0T3Zlci5hZGQodGhpcy5vdmVyTXVsdGlnYW1lLCB0aGlzKTtcclxuICAgICAgbXVsdGlHYW1lLmV2ZW50cy5vbklucHV0T3V0LmFkZCh0aGlzLm91dE11bHRpZ2FtZSwgdGhpcyk7XHJcbiAgICAgIG11bHRpR2FtZS5ldmVudHMub25JbnB1dERvd24uYWRkKHRoaXMucGxheU11bHRpR2FtZSwgdGhpcyk7XHJcblxyXG4gICAgICAvLyBKdWljeVxyXG4gICAgICB0aGlzLmp1aWN5ID0gZ2FtZS5wbHVnaW5zLmFkZChQaGFzZXIuUGx1Z2luLkp1aWN5KTtcclxuICAgICAgdGhpcy5zY3JlZW5GbGFzaCA9IHRoaXMuanVpY3kuY3JlYXRlU2NyZWVuRmxhc2goKTtcclxuICAgICAgdGhpcy5hZGQuZXhpc3RpbmcodGhpcy5zY3JlZW5GbGFzaCk7XHJcblxyXG4gICAgICAvLyBNdXNpY1xyXG4gICAgICB0aGlzLm1lbnVfbXVzaWMgPSBnYW1lLmFkZC5hdWRpbygnbWVudV9tdXNpYycpO1xyXG4gICAgICB0aGlzLmRpbmsgICAgICAgPSBnYW1lLmFkZC5hdWRpbygnZGluaycpO1xyXG4gICAgICB0aGlzLm1lbnVfbXVzaWMucGxheSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwbGF5R2FtZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIEdhbWUubXVsdGlwbGF5ZXIgPSBmYWxzZTtcclxuICAgICAgdGhpcy5tZW51X211c2ljLnN0b3AoKTtcclxuICAgICAgdGhpcy5nYW1lLnN0YXRlLnN0YXJ0KCdQbGF5Jyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBsYXlNdWx0aUdhbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBHYW1lLm11bHRpcGxheWVyID0gdHJ1ZTtcclxuICAgICAgdGhpcy5wbGF5KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG92ZXJOZXdnYW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLm5ld0dhbWUuc2NhbGUpXHJcbiAgICAgICAgLnRvKHt4OiAxLjMsIHk6IDEuM30sIDMwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUpXHJcbiAgICAgIHRoaXMuZGluay5wbGF5KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG92ZXJNdWx0aWdhbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMubXVsdGlHYW1lLnNjYWxlKVxyXG4gICAgICAgIC50byh7eDogMS4zLCB5OiAxLjN9LCAzMDAsIFBoYXNlci5FYXNpbmcuRXhwb25lbnRpYWwuT3V0LCB0cnVlKVxyXG4gICAgICB0aGlzLmRpbmsucGxheSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvdXRNdWx0aWdhbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMubXVsdGlHYW1lLnNjYWxlKVxyXG4gICAgICAgIC50byh7eDogMSwgeTogMX0sIDMwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUpXHJcbiAgICAgIHRoaXMuZGluay5wbGF5KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG91dE5ld2dhbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMubmV3R2FtZS5zY2FsZSlcclxuICAgICAgICAudG8oe3g6IDEsIHk6IDF9LCAzMDAsIFBoYXNlci5FYXNpbmcuRXhwb25lbnRpYWwuT3V0LCB0cnVlKTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XHJcbiAgdmFyIGcgPSBHYW1lO1xyXG4gIEdhbWUuU3RhdGVzLlBsYXkgPSBmdW5jdGlvbihnYW1lKSB7fVxyXG5cclxuICBHYW1lLlN0YXRlcy5QbGF5LnByb3RvdHlwZSA9IHtcclxuICAgIGNyZWF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBnYW1lID0gdGhpcy5nYW1lO1xyXG4gICAgICB0aGlzLmxldmVsICAgICAgPSBHYW1lLmN1cnJlbnRMZXZlbCB8fCAwO1xyXG4gICAgICB0aGlzLmxldmVsRGF0YSAgPSBHYW1lLkxldmVsc1t0aGlzLmxldmVsXTtcclxuICAgICAgdGhpcy5wb2ludHMgICAgID0gMDtcclxuXHJcbiAgICAgIC8vIEJhY2tncm91bmRcclxuICAgICAgdGhpcy5iYWNrZ3JvdW5kID0gdGhpcy5nYW1lLmFkZC50aWxlU3ByaXRlKDAsIDAsIHRoaXMuZ2FtZS53aWR0aCwgdGhpcy5nYW1lLmhlaWdodCwgJ2JhY2tncm91bmQnICsgdGhpcy5sZXZlbCk7XHJcbiAgICAgIHRoaXMuYmFja2dyb3VuZC5hdXRvU2Nyb2xsKDEsIDE1KTtcclxuICAgICAgdGhpcy5iYWNrZ3JvdW5kLnRpbGVQb3NpdGlvbi54ID0gR2FtZS5iYWNrZ3JvdW5kWDtcclxuICAgICAgdGhpcy5iYWNrZ3JvdW5kLnRpbGVQb3NpdGlvbi55ID0gR2FtZS5iYWNrZ3JvdW5kWTtcclxuICAgICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLmJhY2tncm91bmQpXHJcbiAgICAgICAgLnRvKHthbHBoYTogMC4zfSwgXHJcbiAgICAgICAgICA1MDAwLCBcclxuICAgICAgICAgIFBoYXNlci5FYXNpbmcuTGluZWFyLk5PTkUsIFxyXG4gICAgICAgICAgdHJ1ZSwgMCwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLCB0cnVlKTtcclxuXHJcbiAgICAgIC8vIEZQU1xyXG4gICAgICB0aGlzLmdhbWUudGltZS5hZHZhbmNlZFRpbWluZyA9IHRydWU7XHJcbiAgICAgIHRoaXMuZnBzVGV4dCA9IHRoaXMuZ2FtZS5hZGQudGV4dChcclxuICAgICAgICAgIDEwMCwgKHRoaXMuZ2FtZS5oZWlnaHQgLSAyNiksICcnLCBcclxuICAgICAgICAgIHsgZm9udDogJzE2cHggQXJpYWwnLCBmaWxsOiAnI2ZmZmZmZicgfVxyXG4gICAgICApO1xyXG5cclxuICAgICAgLy8gRW5lbXkgTGFzZXJzXHJcbiAgICAgIHRoaXMubGFzZXJzICAgICAgICAgPSBnYW1lLmFkZC5ncm91cCgpO1xyXG4gICAgICAvLyBFbmVtaWVzXHJcbiAgICAgIC8vIHRoaXMuZW5lbWllcyAgICAgICAgPSBnYW1lLmFkZC5ncm91cCgpO1xyXG4gICAgICB0aGlzLmVuZW15R3JvdXBzICAgID0ge307IC8vPSBnYW1lLmFkZC5ncm91cCgpO1xyXG4gICAgICB0aGlzLmVuZW15R3JvdXBzQ291bnQgPSAwO1xyXG4gICAgICB2YXIgbGV2ZWxFbmVtaWVzID0gdGhpcy5sZXZlbERhdGEuZW5lbWllcztcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbGV2ZWxFbmVtaWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5lbmVteUdyb3Vwc1tpXSA9IGdhbWUuYWRkLmdyb3VwKCk7XHJcbiAgICAgICAgdGhpcy5lbmVteUdyb3Vwc0NvdW50Kys7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLnNjb3JlID0gMDtcclxuICAgICAgLy8gVGhpcyBwbGF5ZXIncyBidWxsZXRzXHJcbiAgICAgIHRoaXMuYnVsbGV0cyAgICAgICAgPSBnYW1lLmFkZC5ncm91cCgpO1xyXG4gICAgICAvLyBPdGhlciBidWxsZXRzXHJcbiAgICAgIHRoaXMucmVtb3RlQnVsbGV0cyAgPSBnYW1lLmFkZC5ncm91cCgpO1xyXG4gICAgICAvLyBXZSBoYXZlIG90aGVyIHBsYXllcnNcclxuICAgICAgZy5yZW1vdGVQbGF5ZXJzICA9IGdhbWUucmVtb3RlUGxheWVycyB8fCBbXTtcclxuXHJcbiAgICAgIC8vIFNldHVwIHNob290aW5nXHJcbiAgICAgIHRoaXMuZ2FtZS5pbnB1dC5vbkRvd24uYWRkKHRoaXMuc2hvb3RCdWxsZXQsIHRoaXMpO1xyXG5cclxuICAgICAgZy5zaW8gPSBnLnNvY2tldDtcclxuXHJcbiAgICAgIC8vIFdlIEFMV0FZUyBoYXZlIHVzIGFzIGEgcGxheWVyXHJcbiAgICAgIGcuaGVybyA9IHRoaXMuaGVybyA9IG5ldyBHYW1lLlByZWZhYnMuUGxheWVyKHRoaXMuZ2FtZSwgXHJcbiAgICAgICAgICB0aGlzLmdhbWUud2lkdGgvMiwgXHJcbiAgICAgICAgICB0aGlzLmdhbWUuaGVpZ2h0ICsgNjAgKyAyMCxcclxuICAgICAgICAgIHRoaXMuZ2FtZS5pbnB1dCxcclxuICAgICAgICAgIHRydWUsIGcuc2lvKTtcclxuICAgICAgXHJcbiAgICAgIHRoaXMuZ2FtZS5hZGQuZXhpc3RpbmcodGhpcy5oZXJvKTtcclxuICAgICAgLy8gdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLmhlcm8pXHJcbiAgICAgICAgLy8gLnRvKHtcclxuICAgICAgICAvLyAgIHk6IHRoaXMuZ2FtZS5oZWlnaHQgLSAodGhpcy5oZXJvLmhlaWdodCArIDIwKVxyXG4gICAgICAgIC8vIH0sIDE1MDAsIFBoYXNlci5FYXNpbmcuRXhwb25lbnRpYWwuT3V0LCB0cnVlKTtcclxuXHJcbiAgICAgIC8vIERpc3BsYXkgbGl2ZXNcclxuICAgICAgdGhpcy5saXZlc0dyb3VwID0gdGhpcy5nYW1lLmFkZC5ncm91cCgpO1xyXG4gICAgICB0aGlzLmxpdmVzR3JvdXAuYWRkKHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdsaXZlcycpKTtcclxuICAgICAgdGhpcy5saXZlc0dyb3VwLmFkZCh0aGlzLmdhbWUuYWRkLnNwcml0ZSgyMCwgMywgJ251bScsIDApKTtcclxuICAgICAgdGhpcy5saXZlc051bSA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDM1LCAzLCAnbnVtJywgdGhpcy5oZXJvLmxpdmVzKzEpO1xyXG4gICAgICB0aGlzLmxpdmVzR3JvdXAuYWRkKHRoaXMubGl2ZXNOdW0pO1xyXG4gICAgICB0aGlzLmxpdmVzR3JvdXAueCA9IHRoaXMuZ2FtZS53aWR0aCAtIDU1O1xyXG4gICAgICB0aGlzLmxpdmVzR3JvdXAueSA9IDU7XHJcbiAgICAgIHRoaXMubGl2ZXNHcm91cC5hbHBoYSA9IDA7XHJcblxyXG4gICAgICAvLyBBZGQgYnVsbGV0c1xyXG4gICAgICBmb3IodmFyIGkgPSAwOyBpPHRoaXMuaGVyby5udW1CdWxsZXRzOyBpKyspe1xyXG4gICAgICAgIHZhciBidWxsZXQgPSBuZXcgR2FtZS5QcmVmYWJzLkJ1bGxldCh0aGlzLmdhbWUsIDAsIDAsIHRoaXMuaGVybyk7XHJcbiAgICAgICAgdGhpcy5idWxsZXRzLmFkZChidWxsZXQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTY29yZVxyXG4gICAgICB0aGlzLnNjb3JlID0gMDtcclxuICAgICAgdGhpcy5zY29yZVRleHQgPSB0aGlzLmdhbWUuYWRkLmJpdG1hcFRleHQoMTAsIHRoaXMuZ2FtZS5oZWlnaHQgLSAyNywgJ2FyY2hpdGVjdHNEYXVnaHRlcicsICdTY29yZTogMCcsIDE2KTtcclxuICAgICAgdGhpcy5zY29yZVRleHQuYWxwaGEgPSAwO1xyXG5cclxuICAgICAgLy8gSnVpY3lcclxuICAgICAgdGhpcy5qdWljeSA9IHRoaXMuZ2FtZS5wbHVnaW5zLmFkZChQaGFzZXIuUGx1Z2luLkp1aWN5KTtcclxuICAgICAgdGhpcy5zY3JlZW5GbGFzaCA9IHRoaXMuanVpY3kuY3JlYXRlU2NyZWVuRmxhc2goKTtcclxuICAgICAgdGhpcy5hZGQuZXhpc3RpbmcodGhpcy5zY3JlZW5GbGFzaCk7XHJcbiAgICAgIFxyXG4gICAgICB0aGlzLmdhbWVfbXVzaWMgPSBnYW1lLmFkZC5hdWRpbygnZ2FtZV9tdXNpYycpO1xyXG4gICAgICAvLyB0aGlzLmdhbWVfbXVzaWMucGxheSgpO1xyXG5cclxuICAgICAgLy8gRW50ZXIgcGxheSBtb2RlIGFmdGVyIGluaXQgc3RhdGVcclxuICAgICAgdGhpcy50aW1lckluaXQgPSB0aGlzLmdhbWUudGltZS5jcmVhdGUodHJ1ZSk7XHJcbiAgICAgIHRoaXMudGltZXJJbml0LmFkZChQaGFzZXIuVGltZXIuU0VDT05EKjEuNSwgdGhpcy5pbml0R2FtZSwgdGhpcyk7XHJcbiAgICAgIHRoaXMudGltZXJJbml0LnN0YXJ0KCk7XHJcblxyXG4gICAgICB2YXIgZ2FtZVBsYXkgPSB0aGlzO1xyXG4gICAgICB2YXIgZ2FtZVBsYXllciA9IF8uZXh0ZW5kKHRoaXMuaGVybywge1xyXG4gICAgICAgIGlkOiBnLnNpZCxcclxuICAgICAgICBuYW1lOiAnWW91IGpvaW5lZCdcclxuICAgICAgfSlcclxuICAgICAgZ2FtZVBsYXkuZ2FtZS5zY29wZVxyXG4gICAgICAgICAgLiRlbWl0KCdnYW1lOm5ld1BsYXllcicsIGdhbWVQbGF5ZXIpO1xyXG5cclxuICAgICAgaWYgKEdhbWUubXVsdGlwbGF5ZXIpIHtcclxuICAgICAgICAvLyBIZWxwZXJzXHJcbiAgICAgICAgdmFyIHJlbW92ZVBsYXllciA9IGZ1bmN0aW9uKHBsYXllciwgbWFwKSB7XHJcbiAgICAgICAgICBnLnJlbW90ZVBsYXllcnMuc3BsaWNlKGcucmVtb3RlUGxheWVycy5pbmRleE9mKHBsYXllciksIDEpO1xyXG4gICAgICAgICAgR2FtZS50b1JlbW92ZS5wdXNoKHBsYXllcik7XHJcbiAgICAgICAgICBnYW1lUGxheS5nYW1lLnNjb3BlLiRlbWl0KCdnYW1lOnJlbW92ZVBsYXllcicsIHtcclxuICAgICAgICAgICAgcGxheWVyOiBwbGF5ZXIsXHJcbiAgICAgICAgICAgIG1hcElkOiBtYXBcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSGFuZGxlcnNcclxuICAgICAgICB0aGlzLmdhbWUuc29ja2V0Lm9uKCdnYW1lVXBkYXRlZDphZGQnLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnZ2FtZVVwZGF0ZWQ6YWRkJyk7XHJcbiAgICAgICAgICB2YXIgYWxsUGxheWVycyA9IGRhdGEuYWxsUGxheWVycyxcclxuICAgICAgICAgICAgICBuZXdQbGF5ZXJzID0gW107XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWxsUGxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgcGxheWVySW5RdWVzdGlvbiA9IGFsbFBsYXllcnNbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAocGxheWVySW5RdWVzdGlvbi5pZCA9PT0gZy5oZXJvLmlkKSB7XHJcbiAgICAgICAgICAgICAgLy8gTm9wZSwgd2UncmUgYWxyZWFkeSBhZGRlZFxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKEdhbWUucGxheWVyQnlJZChwbGF5ZXJJblF1ZXN0aW9uLmlkKSkge1xyXG4gICAgICAgICAgICAgIC8vIE5vcGUsIHdlIGFscmVhZHkga25vdyBhYm91dCAnZW1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBnLnRvQWRkLnB1c2gocGxheWVySW5RdWVzdGlvbik7XHJcbiAgICAgICAgICAgICAgZ2FtZVBsYXkuZ2FtZS5zY29wZS4kZW1pdCgnZ2FtZTpuZXdQbGF5ZXInLCBwbGF5ZXJJblF1ZXN0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmdhbWUuc29ja2V0Lm9uKCdnYW1lVXBkYXRlZDpyZW1vdmUnLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICB2YXIgYWxsUGxheWVycyA9IGcucmVtb3RlUGxheWVycyxcclxuICAgICAgICAgICAgICBuZXdQbGF5ZXJMaXN0ID0gZGF0YS5hbGxQbGF5ZXJzLFxyXG4gICAgICAgICAgICAgIG5ld1BsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgICAgICB2YXIgbWFwSWQgPSBkYXRhLm1hcDtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxQbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwbGF5ZXJJblF1ZXN0aW9uID0gYWxsUGxheWVyc1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwbGF5ZXJJblF1ZXN0aW9uLmlkID09PSBnLmhlcm8uaWQpIHtcclxuICAgICAgICAgICAgICAvLyBOb3BlLCB3ZSdyZSBhbHJlYWR5IGFkZGVkXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZXdQbGF5ZXJMaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV3UGxheWVyTGlzdFtpXS5pZCA9PT0gcGxheWVySW5RdWVzdGlvbi5pZCkge1xyXG4gICAgICAgICAgICAgICAgICAvLyBUaGUgcGxheWVyIGlzIGluIHRoZSBuZXcgcGxheWVyIGxpc3RcclxuICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgaGF2ZSB0byByZW1vdmUgdGhlbVxyXG4gICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmICghZm91bmQpIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIGNhbiByZW1vdmUgdGhpcyBwbGF5ZXJcclxuICAgICAgICAgICAgICAgIHJlbW92ZVBsYXllcihwbGF5ZXJJblF1ZXN0aW9uLCBtYXBJZCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZ2FtZS5zb2NrZXQub24oJ3VwZGF0ZVBsYXllcnMnLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICB2YXIgcGxheWVyc0RhdGEgPSBkYXRhLmdhbWUucGxheWVycztcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBsYXllcnNEYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwbGF5ZXJEYXRhID0gcGxheWVyc0RhdGFbaV07XHJcbiAgICAgICAgICAgIHZhciBwbGF5ZXI7XHJcblxyXG4gICAgICAgICAgICBpZiAocGxheWVyRGF0YS5pZCAhPT0gZy5zaWQpIHtcclxuICAgICAgICAgICAgICBwbGF5ZXIgPSBHYW1lLnBsYXllckJ5SWQocGxheWVyRGF0YS5pZCk7XHJcbiAgICAgICAgICAgICAgaWYgKHBsYXllcikge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLm9uVXBkYXRlRnJvbVNlcnZlcihwbGF5ZXJEYXRhKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZ2FtZS5zb2NrZXQub24oJ2J1bGxldFNob3QnLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICB2YXIgcGxheWVyID0gR2FtZS5wbGF5ZXJCeUlkKGRhdGEuaWQpO1xyXG5cclxuICAgICAgICAgIGlmIChwbGF5ZXIpIHtcclxuICAgICAgICAgICAgYnVsbGV0ID0gZ2FtZVBsYXkucmVtb3RlQnVsbGV0cy5nZXRGaXJzdEV4aXN0cyhmYWxzZSk7XHJcbiAgICAgICAgICAgIGlmKCFidWxsZXQpe1xyXG4gICAgICAgICAgICAgIGJ1bGxldCA9IG5ldyBHYW1lLlByZWZhYnMuQnVsbGV0KHRoaXMuZ2FtZSwgZGF0YS54LCBkYXRhLnksIHBsYXllcik7XHJcbiAgICAgICAgICAgICAgZ2FtZVBsYXkucmVtb3RlQnVsbGV0cy5hZGQoYnVsbGV0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBTaG9vdCB0aGUgZGFybiB0aGluZ1xyXG4gICAgICAgICAgICBidWxsZXQuc2hvb3QoKTtcclxuXHJcbiAgICAgICAgICAgIGJ1bGxldC5yZXNldChkYXRhLngsIGRhdGEueSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZ2FtZS5zb2NrZXQub24oJ3BsYXllckhpdCcsIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgIGlmIChkYXRhLnZpY3RpbSA9PT0gZy5zaWQpIHtcclxuICAgICAgICAgICAgLy8gV2Ugd2VyZSBoaXRcclxuICAgICAgICAgICAgaWYgKGRhdGEudmljdGltSGVhbHRoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgZ2FtZVBsYXkuZ2FtZU92ZXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIHBsYXllciA9IEdhbWUucGxheWVyQnlJZChkYXRhLnZpY3RpbSk7XHJcbiAgICAgICAgICAgIGlmIChwbGF5ZXIpIHtcclxuICAgICAgICAgICAgICBpZiAoZGF0YS52aWN0aW1IZWFsdGggPD0gMCkge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLmRpZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmdhbWUuc29ja2V0Lm9uKCdnYW1lT3ZlcicsIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgIHZhciB3aW5uZXJJZCA9IGRhdGEud2lubmVyLmlkO1xyXG4gICAgICAgICAgaWYgKHdpbm5lcklkID09PSBnLnNpZCkge1xyXG4gICAgICAgICAgICAvLyBXRSBXT04hXHJcbiAgICAgICAgICAgIEdhbWUud2lubmVyID0gdHJ1ZTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFdlIExPU1QgOihcclxuICAgICAgICAgICAgR2FtZS53aW5uZXIgPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGdhbWVQbGF5LmdhbWVPdmVyKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGcuc29ja2V0LmVtaXQoJ25ld1BsYXllcicsIHtcclxuICAgICAgICAgIG1hcElkOiBHYW1lLm1hcElkLFxyXG4gICAgICAgICAgaGVhbHRoOiB0aGlzLmhlcm8uaGVhbHRoXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYoIUdhbWUucGF1c2VkKXtcclxuICAgICAgICAvLyB0aGlzLnVwZGF0ZVBsYXllcigpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZFBsYXllcnMoKTtcclxuICAgICAgICB0aGlzLnJlbW92ZVBsYXllcnMoKTtcclxuICAgICAgICAvLyBSdW4gZ2FtZSBsb29wIHRoaW5neVxyXG4gICAgICAgIHRoaXMuY2hlY2tDb2xsaXNpb25zKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZnBzVGV4dC5zZXRUZXh0KHRoaXMuZ2FtZS50aW1lLmZwcyArICcgRlBTJyk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlUmVtb3RlU2VydmVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGdhbWUgPSB0aGlzLmdhbWU7XHJcblxyXG4gICAgICBnLnNvY2tldC5lbWl0KCd1cGRhdGVQbGF5ZXInLCB7XHJcbiAgICAgICAgeDogdGhpcy5oZXJvLngsXHJcbiAgICAgICAgeTogdGhpcy5oZXJvLnksXHJcbiAgICAgICAgeFJlbDogdGhpcy5oZXJvLnggLyAoR2FtZS53aWR0aCA9PT0gMCA/IDEgOiBHYW1lLndpZHRoKSxcclxuICAgICAgICB5UmVsOiB0aGlzLmhlcm8ueSAvIChHYW1lLmhlaWdodCA9PT0gMCA/IDEgOiBHYW1lLmhlaWdodCksXHJcbiAgICAgICAgaGVhbHRoOiB0aGlzLmhlcm8uaGVhbHRoLFxyXG4gICAgICAgIHJvdGF0aW9uOiB0aGlzLmhlcm8ucm90YXRpb24sXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLmdldFRpbWUoKVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHRoaXMudXBkYXRlUmVtb3RlU2VydmVyVGltZXIgPSB0aGlzLmdhbWUudGltZS5ldmVudHNcclxuICAgICAgICAuYWRkKFxyXG4gICAgICAgICAgMjAsIC8vIEV2ZXJ5IDEwMCBtaWxpc2Vjb25kc1xyXG4gICAgICAgICAgdGhpcy51cGRhdGVSZW1vdGVTZXJ2ZXIsXHJcbiAgICAgICAgICB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkUGxheWVyczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHdoaWxlIChnLnRvQWRkLmxlbmd0aCAhPT0gMCkge1xyXG4gICAgICAgIHZhciBkYXRhID0gZy50b0FkZC5zaGlmdCgpO1xyXG4gICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICB2YXIgdG9BZGQgPSBcclxuICAgICAgICAgICAgdGhpcy5hZGRQbGF5ZXIoZGF0YS54LCBkYXRhLnksIGRhdGEuaWQpO1xyXG4gICAgICAgICAgZy5yZW1vdGVQbGF5ZXJzLnB1c2godG9BZGQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBhZGRQbGF5ZXI6IGZ1bmN0aW9uKHgsIHksIGlkKSB7XHJcbiAgICAgIC8vIFdlIEFMV0FZUyBoYXZlIHVzIGFzIGEgcGxheWVyXHJcbiAgICAgIHZhciBwbGF5ZXIgPSBuZXcgR2FtZS5QcmVmYWJzLlBsYXllcih0aGlzLmdhbWUsIHRoaXMuZ2FtZS53aWR0aC8yLCAxMDAsIG51bGwsIGlkKTtcclxuICAgICAgdGhpcy5nYW1lLmFkZC5leGlzdGluZyhwbGF5ZXIpO1xyXG5cclxuICAgICAgcmV0dXJuIHBsYXllcjtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlUGxheWVyczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHdoaWxlIChnLnRvUmVtb3ZlLmxlbmd0aCAhPT0gMCkge1xyXG4gICAgICAgIHZhciB0b1JlbW92ZSA9IGcudG9SZW1vdmUuc2hpZnQoKTtcclxuICAgICAgICB0aGlzLmdhbWUud29ybGQucmVtb3ZlQ2hpbGQodG9SZW1vdmUsIHRydWUpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNodXRkb3duOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5idWxsZXRzLmRlc3Ryb3koKTtcclxuICAgICAgdGhpcy5mb3JFYWNoRW5lbXkoZnVuY3Rpb24oZW5lbXkpIHtcclxuICAgICAgICBlbmVteS5kZXN0cm95KCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLmxhc2Vycy5kZXN0cm95KCk7XHJcbiAgICAgIC8vIHRoaXMudXBkYXRlUGxheWVycy50aW1lci5wYXVzZSgpO1xyXG4gICAgICBHYW1lLnBhdXNlZCA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGdvVG9NZW51OiBmdW5jdGlvbigpIHtcclxuICAgICAgR2FtZS5iYWNrZ3JvdW5kWCA9IHRoaXMuYmFja2dyb3VuZC50aWxlUG9zaXRpb24ueDtcclxuICAgICAgR2FtZS5iYWNrZ3JvdW5kWSA9IHRoaXMuYmFja2dyb3VuZC50aWxlUG9zaXRpb24ueTtcclxuXHJcbiAgICAgIHRoaXMuZ2FtZS5zdGF0ZS5zdGFydCgnTWFpbk1lbnUnKTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5pdEdhbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIEdlbmVyYXRlIGVuZW1pZXNcclxuICAgICAgLy8gdGhpcy5lbmVtaWVzR2VuZXJhdG9yID0gdGhpcy5nYW1lLnRpbWUuZXZlbnRzXHJcbiAgICAgICAgLy8gLmFkZCgyMDAwLCB0aGlzLmdlbmVyYXRlRW5lbWllcywgdGhpcyk7XHJcblxyXG4gICAgICAvLyBHZW5lcmF0ZSBlbmVtaWVzIGxhc2VyXHJcbiAgICAgIC8vIHRoaXMubGFzZXJzR2VuZXJhdG9yID0gdGhpcy5nYW1lLnRpbWUuZXZlbnRzXHJcbiAgICAgICAgLy8gLmFkZCgxMDAwLCB0aGlzLnNob290TGFzZXIsIHRoaXMpO1xyXG5cclxuICAgICAgLy8gR2VuZXJhdGUgc2VydmVyIHVwZGF0ZXNcclxuICAgICAgdGhpcy51cGRhdGVSZW1vdGVTZXJ2ZXJUaW1lciA9IHRoaXMuZ2FtZS50aW1lLmV2ZW50c1xyXG4gICAgICAgIC5hZGQoMjAwLCB0aGlzLnVwZGF0ZVJlbW90ZVNlcnZlciwgdGhpcyk7XHJcblxyXG4gICAgICAvLyBTaG93IFVJXHJcbiAgICAgIC8vIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5saXZlc0dyb3VwKVxyXG4gICAgICAvLyAgIC50byh7YWxwaGE6MX0sIDYwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUpO1xyXG4gICAgICAvLyB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMuc2NvcmVUZXh0KVxyXG4gICAgICAvLyAgIC50byh7YWxwaGE6MX0sIDYwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUpO1xyXG5cclxuICAgICAgLy8gUGxheVxyXG4gICAgICB0aGlzLnBsYXlHYW1lKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBsYXlHYW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKEdhbWUucGF1c2VkKSB7XHJcbiAgICAgICAgR2FtZS5wYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5oZXJvLmZvbGxvdyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5oZXJvLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8gTkVFRCBUTyBVUERBVEUgVEhJU1xyXG4gICAgICAgIC8vIHRoaXMuZW5lbWllc0dlbmVyYXRvci50aW1lci5yZXN1bWUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXNlcnMuZm9yRWFjaChmdW5jdGlvbihsYXNlcikge1xyXG4gICAgICAgICAgbGFzZXIucmVzdW1lKCk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC54ID0gdGhpcy5oZXJvLng7XHJcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LnkgPSB0aGlzLmhlcm8ueTtcclxuXHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2VuZXJhdGVFbmVtaWVzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGxldmVsRW5lbWllcyA9IHRoaXMubGV2ZWxEYXRhLmVuZW1pZXM7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGV2ZWxFbmVtaWVzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgIHZhciBlbmVteUdyb3VwID0gdGhpcy5lbmVteUdyb3Vwc1tpXSxcclxuICAgICAgICAgICAgbGV2ZWxFbmVteSAgPSBsZXZlbEVuZW1pZXNbaV07XHJcbiAgICAgICAgdmFyIGVuZW1pZXMgPSBlbmVteUdyb3VwLmdldEZpcnN0RXhpc3RzKGZhbHNlKTtcclxuXHJcbiAgICAgICAgaWYoIWVuZW1pZXMpe1xyXG4gICAgICAgICAgZW5lbWllcyA9IG5ldyBHYW1lLlByZWZhYnNcclxuICAgICAgICAgICAgLkVuZW1pZXModGhpcy5nYW1lLCBcclxuICAgICAgICAgICAgICBsZXZlbEVuZW15LmNvdW50IHx8IDEwLCBcclxuICAgICAgICAgICAgICBsZXZlbEVuZW15LFxyXG4gICAgICAgICAgICAgIHRoaXMuaGVybyxcclxuICAgICAgICAgICAgICB0aGlzLmVuZW15R3JvdXBzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcmVzZXQoZnJvbVksIHRvWSwgc3BlZWQpXHJcbiAgICAgICAgZW5lbWllc1xyXG4gICAgICAgICAgLnJlc2V0KHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoMCwgdGhpcy5nYW1lLndpZHRoKSwgXHJcbiAgICAgICAgICAgICAgdGhpcy5nYW1lLnJuZC5pbnRlZ2VySW5SYW5nZSgwLCB0aGlzLmdhbWUud2lkdGgpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmVsYXVuY2ggdGltZXIgZGVwZW5kaW5nIG9uIGxldmVsXHJcbiAgICAgIHRoaXMuZW5lbWllc0dlbmVyYXRvciA9IHRoaXMuZ2FtZS50aW1lLmV2ZW50c1xyXG4gICAgICAgIC5hZGQoXHJcbiAgICAgICAgICB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKDIwLCA1MCkgKiA1MDAvKHRoaXMubGV2ZWwgKyAxKSwgXHJcbiAgICAgICAgICB0aGlzLmdlbmVyYXRlRW5lbWllcywgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNob290QnVsbGV0OiBmdW5jdGlvbigpe1xyXG4gICAgICAvLyBDaGVjayBkZWxheSB0aW1lXHJcbiAgICAgIGlmKHRoaXMubGFzdEJ1bGxldFNob3RBdCA9PT0gdW5kZWZpbmVkKSB0aGlzLmxhc3RCdWxsZXRTaG90QXQgPSAwO1xyXG4gICAgICBpZih0aGlzLmdhbWUudGltZS5ub3cgLSB0aGlzLmxhc3RCdWxsZXRTaG90QXQgPCB0aGlzLmhlcm8uc2hvdERlbGF5KXtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5sYXN0QnVsbGV0U2hvdEF0ID0gdGhpcy5nYW1lLnRpbWUubm93O1xyXG5cclxuICAgICAgLy8gQ3JlYXRlIGJ1bGxldHNcclxuICAgICAgdmFyIGJ1bGxldCwgYnVsbGV0UG9zWTtcclxuICAgICAgYnVsbGV0ID0gdGhpcy5idWxsZXRzLmdldEZpcnN0RXhpc3RzKGZhbHNlKTtcclxuICAgICAgaWYoYnVsbGV0KSB7XHJcblxyXG4gICAgICAgIGJ1bGxldC5yZXNldCh0aGlzLmhlcm8ueCwgdGhpcy5oZXJvLnkpO1xyXG4gICAgICAgIC8vIFNob290IHRoZSBkYXJuIHRoaW5nXHJcbiAgICAgICAgYnVsbGV0LnNob290KCk7XHJcblxyXG4gICAgICAgIHRoaXMuZ2FtZS5zb2NrZXQuZW1pdCgnc2hvdGJ1bGxldCcsIHtcclxuICAgICAgICAgIGlkOiBnLnNpZCxcclxuICAgICAgICAgIHk6IGJ1bGxldC55LFxyXG4gICAgICAgICAgeDogYnVsbGV0LngsXHJcbiAgICAgICAgICByb3RhdGlvbjogYnVsbGV0LnJvdGF0aW9uXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgY2hlY2tDb2xsaXNpb25zOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKEdhbWUubXVsdGlwbGF5ZXIpIHtcclxuICAgICAgICAvLyBnLnJlbW90ZVBsYXllcnMuZm9yRWFjaChmdW5jdGlvbihwbGF5ZXIpIHtcclxuICAgICAgICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKFxyXG4gICAgICAgICAgICAgIHRoaXMucmVtb3RlQnVsbGV0cywgXHJcbiAgICAgICAgICAgICAgdGhpcy5oZXJvLCB0aGlzLmtpbGxIZXJvLFxyXG4gICAgICAgICAgICAgIG51bGwsIHRoaXMpO1xyXG5cclxuICAgICAgICAgIGcucmVtb3RlUGxheWVycy5mb3JFYWNoKGZ1bmN0aW9uKHJlbW90ZVBsYXllcikge1xyXG4gICAgICAgICAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcChcclxuICAgICAgICAgICAgICB0aGlzLmJ1bGxldHMsIHJlbW90ZVBsYXllciwgdGhpcy5oaXRBUmVtb3RlUGxheWVyLCBudWxsLCB0aGlzKTtcclxuICAgICAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgICAvLyB9LCB0aGlzKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBTaW5nbGUgcGxheWVyIG1vZGUgcmVxdWlyZXMgZW5lbWllc1xyXG4gICAgICAgICAgdmFyIGxldmVsRW5lbWllcyA9IHRoaXMuZW5lbXlHcm91cHM7XHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZW5lbXlHcm91cHNDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBlbmVtaWVzID0gbGV2ZWxFbmVtaWVzW2ldO1xyXG4gICAgICAgICAgICBlbmVtaWVzLmZvckVhY2goZnVuY3Rpb24oZW5lbXkpIHtcclxuICAgICAgICAgICAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLmJ1bGxldHMsIGVuZW15LCB0aGlzLmtpbGxFbmVteSwgbnVsbCwgdGhpcyk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgZW5lbWllcy5mb3JFYWNoKGZ1bmN0aW9uKGVuZW15KSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5oZXJvLCBlbmVteSwgdGhpcy5raWxsSGVybywgbnVsbCwgdGhpcyk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuaGVybywgdGhpcy5sYXNlcnMsIHRoaXMua2lsbEhlcm8sIG51bGwsIHRoaXMpO1xyXG4gICAgICAgICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5oZXJvLCB0aGlzLmJvbnVzLCB0aGlzLmFjdGl2ZUJvbnVzLCBudWxsLCB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHVwZGF0ZVNjb3JlOiBmdW5jdGlvbihlbmVteSkge1xyXG4gICAgICB0aGlzLnNjb3JlICs9IGVuZW15LmRlc2MgPyBlbmVteS5kZXNjLm1heEhlYWx0aCA6IDE7XHJcbiAgICAgIHRoaXMuc2NvcmVUZXh0LnNldFRleHQoJ1Njb3JlOiAnICsgdGhpcy5zY29yZSArICcnKTtcclxuICAgIH0sXHJcblxyXG4gICAga2lsbEVuZW15OiBmdW5jdGlvbihidWxsZXQsIGVuZW15KSB7XHJcbiAgICAgIGlmICghZW5lbXkuZGVhZCAmJiBlbmVteS5jaGVja1dvcmxkQm91bmRzKSB7XHJcbiAgICAgICAgZW5lbXkuZGllKCk7XHJcbiAgICAgICAgYnVsbGV0LmtpbGwoKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVNjb3JlKGVuZW15KTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBraWxsSGVybzogZnVuY3Rpb24oaGVybywgZW5lbXkpIHtcclxuICAgICAgaWYoZW5lbXkgaW5zdGFuY2VvZiBHYW1lLlByZWZhYnMuTGFzZXIgfHwgXHJcbiAgICAgICAgICAoZW5lbXkgaW5zdGFuY2VvZiBHYW1lLlByZWZhYnMuRW5lbXkgJiYgXHJcbiAgICAgICAgICAgICFlbmVteS5kZWFkICYmIFxyXG4gICAgICAgICAgICBlbmVteS5jaGVja1dvcmxkQm91bmRzKSl7XHJcbiAgICAgICAgdGhpcy5oZXJvLmxpdmVzLS07XHJcbiAgICAgICAgdGhpcy5zY3JlZW5GbGFzaC5mbGFzaCgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5oZXJvLmxpdmVzIDwgMSkge1xyXG4gICAgICAgICAgdGhpcy5nYW1lT3ZlcigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLmhlcm8uZW5hYmxlU2hpZWxkKDIpO1xyXG4gICAgICAgICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLmxpdmVzTnVtKS50byh7YWxwaGE6MCwgeTogOH0sIDIwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUpLm9uQ29tcGxldGUuYWRkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHRoaXMubGl2ZXNOdW0uZnJhbWUgPSB0aGlzLmhlcm8ubGl2ZXMrMTtcclxuICAgICAgICAgICAgdGhpcy5saXZlc051bS55ID0gLTI7XHJcbiAgICAgICAgICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5saXZlc051bSkudG8oe2FscGhhOjEsIHk6M30sIDIwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUpO1xyXG4gICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSBlbHNlIGlmIChlbmVteSBpbnN0YW5jZW9mIEdhbWUuUHJlZmFicy5CdWxsZXQpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgYnVsbGV0ID0gZW5lbXksXHJcbiAgICAgICAgICAgIHBsYXllciA9IGJ1bGxldC5wbGF5ZXI7XHJcblxyXG4gICAgICAgIGJ1bGxldC5raWxsKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmhlcm8ud2FzSGl0QnkoYnVsbGV0LCBwbGF5ZXIpKSB7XHJcbiAgICAgICAgLy8gU2hvdCBieSBhIHBsYXllclxyXG4gICAgICAgICAgdGhpcy5zY3JlZW5GbGFzaC5mbGFzaCgpO1xyXG5cclxuICAgICAgICAgIC8vIE5vdGlmeSBzZXJ2ZXJcclxuICAgICAgICAgIHRoaXMuZ2FtZS5zb2NrZXQuZW1pdCgncGxheWVySGl0Jywge1xyXG4gICAgICAgICAgICBzaG9vdGVyOiBwbGF5ZXIuaWQsXHJcbiAgICAgICAgICAgIHZpY3RpbTogZy5zaWQsXHJcbiAgICAgICAgICAgIGhlYWx0aDogdGhpcy5oZXJvLmhlYWx0aFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5oZXJvLmhlYWx0aCA8IDApIHtcclxuICAgICAgICAgIHRoaXMuZ2FtZU92ZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGJ1bGxldC5kaWUoKTtcclxuICAgICAgLy8gfSBlbHNlIHtcclxuICAgICAgICAvLyBlbmVteS5kaWUodHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaGl0QVJlbW90ZVBsYXllcjogZnVuY3Rpb24ocGxheWVyLCBidWxsZXQpIHtcclxuICAgICAgaWYgKCFwbGF5ZXIuc2hpZWxkc0VuYWJsZWQpIHtcclxuICAgICAgICBwbGF5ZXIuc2hvd0V4cGxvc2lvbigpO1xyXG4gICAgICB9XHJcbiAgICAgIGJ1bGxldC5raWxsKCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBzaG9vdExhc2VyOiBmdW5jdGlvbigpe1xyXG4gICAgICB2YXIgbGFzZXIgPSB0aGlzLmxhc2Vycy5nZXRGaXJzdEV4aXN0cyhmYWxzZSk7XHJcblxyXG4gICAgICBpZighbGFzZXIpe1xyXG4gICAgICAgIGxhc2VyID0gbmV3IEdhbWUuUHJlZmFicy5MYXNlcih0aGlzLmdhbWUsIDAsIDApO1xyXG4gICAgICAgIHRoaXMubGFzZXJzLmFkZChsYXNlcik7XHJcbiAgICAgIH1cclxuICAgICAgbGFzZXIucmVzZXQoXHJcbiAgICAgICAgICB0aGlzLmdhbWUud2lkdGggKyBsYXNlci53aWR0aC8yLCBcclxuICAgICAgICAgIHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoMjAsIHRoaXMuZ2FtZS5oZWlnaHQpKTtcclxuICAgICAgbGFzZXIucmVsb2FkKDEwMCArICh0aGlzLmxldmVsICsgMSkqMzApO1xyXG5cclxuICAgICAgLy8gUmVsYXVuY2ggYnVsbGV0IHRpbWVyIGRlcGVuZGluZyBvbiBsZXZlbFxyXG4gICAgICB0aGlzLmxhc2Vyc0dlbmVyYXRvciA9IHRoaXMuZ2FtZS50aW1lLmV2ZW50c1xyXG4gICAgICAgIC5hZGQoXHJcbiAgICAgICAgICB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKDEyLCAyMCkgKiAyNTAvKHRoaXMubGV2ZWwgKyAxKSwgXHJcbiAgICAgICAgICB0aGlzLnNob290TGFzZXIsIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnYW1lT3ZlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIHRoaXMuZ2FtZS5pbnB1dC5vbkRvd24uYWRkKHRoaXMuc2hvb3RCdWxsZXQsIHRoaXMpO1xyXG4gICAgICB0aGlzLmdhbWUuaW5wdXQub25Eb3duLnJlbW92ZUFsbCgpO1xyXG5cclxuICAgICAgdGhpcy5nYW1lb3ZlciA9IHRydWU7XHJcblxyXG4gICAgICB0aGlzLmp1aWN5LnNoYWtlKDIwLCA1KTtcclxuXHJcbiAgICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5oZXJvKVxyXG4gICAgICAgIC50byh7YWxwaGE6IDB9LCA1MDAsIFBoYXNlci5FYXNpbmcuRXhwb25lbnRpYWwuT3V0LCB0cnVlKTtcclxuXHJcbiAgICAgIHRoaXMuc2NvcmVUZXh0LmFscGhhID0gMDtcclxuICAgICAgdGhpcy5saXZlc0dyb3VwLmFscGhhID0gMDtcclxuXHJcbiAgICAgIHRoaXMucGF1c2VHYW1lKCk7XHJcblxyXG4gICAgICAvLyBDbGVhbiB1cCBzb2NrZXRcclxuICAgICAgdGhpcy5nYW1lLnNvY2tldC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcclxuXHJcbiAgICAgIC8vIFNob3cgdGhlIGdhbWVvdmVyIHBhbmVsXHJcbiAgICAgIHRoaXMuc3RhdGUuc3RhcnQoJ0dhbWVPdmVyJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGZvckVhY2hFbmVteTogZnVuY3Rpb24oZm4pIHtcclxuICAgICAgdmFyIGxldmVsRW5lbWllcyA9IHRoaXMuZW5lbXlHcm91cHM7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5lbmVteUdyb3Vwc0NvdW50OyBpKyspIHtcclxuICAgICAgICB2YXIgZW5lbWllcyA9IGxldmVsRW5lbWllc1tpXTtcclxuICAgICAgICBlbmVtaWVzLmZvckVhY2goZm4sIHRoaXMpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHBhdXNlR2FtZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICghR2FtZS5wYXVzZWQpIHtcclxuICAgICAgICBHYW1lLnBhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5oZXJvLmZvbGxvdyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoR2FtZS5tdWx0aXBsYXllcikge31cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuZW5lbWllc0dlbmVyYXRvci50aW1lci5wYXVzZSgpO1xyXG5cclxuICAgICAgICAgIHRoaXMuZm9yRWFjaEVuZW15KGZ1bmN0aW9uKGdyb3VwKSB7XHJcbiAgICAgICAgICAgIGdyb3VwLmNhbGxBbGwoJ3BhdXNlJyk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICB0aGlzLmxhc2Vycy5mb3JFYWNoKGZ1bmN0aW9uKGxhc2VyKSB7XHJcbiAgICAgICAgICAgIGxhc2VyLnBhdXNlKCk7XHJcbiAgICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5nYW1lb3Zlcikge1xyXG4gICAgICAgICAgLy8gdGhpcy5wYXVzZVBhbmVsLnNob3coKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XHJcbiAgdmFyIGcgPSBHYW1lO1xyXG5cclxuICBHYW1lLlN0YXRlcy5QcmVsb2FkZXIgPSBmdW5jdGlvbiAoZ2FtZSkge1xyXG4gICAgIHRoaXMuYXNzZXQgPSBudWxsO1xyXG4gICAgIHRoaXMucmVhZHkgPSBmYWxzZTtcclxuXHJcbiAgICAgV2ViRm9udENvbmZpZyA9IHtcclxuICAgICAgICAvLyAgVGhlIEdvb2dsZSBGb250cyB3ZSB3YW50IHRvIGxvYWQgKHNwZWNpZnkgYXMgbWFueSBhcyB5b3UgbGlrZSBpbiB0aGUgYXJyYXkpXHJcbiAgICAgICAgZ29vZ2xlOiB7XHJcbiAgICAgICAgICBmYW1pbGllczogWydSZXZhbGlhJywgJ0FyY2hpdGVjdHMgRGF1Z2h0ZXInXVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgR2FtZS5TdGF0ZXMuUHJlbG9hZGVyLnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBwcmVsb2FkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHRoaXMubG9hZC5vbkxvYWRDb21wbGV0ZS5hZGRPbmNlKHRoaXMub25Mb2FkQ29tcGxldGUsIHRoaXMpO1xyXG4gICAgICB0aGlzLmFzc2V0ID0gdGhpcy5hZGQuc3ByaXRlKHRoaXMud29ybGQuY2VudGVyWCwgdGhpcy53b3JsZC5jZW50ZXJZLCAncHJlbG9hZGVyJyk7XHJcbiAgICAgIHRoaXMuYXNzZXQuYW5jaG9yLnNldFRvKDAuNSwgMC41KTtcclxuICAgICAgdGhpcy5sb2FkLnNldFByZWxvYWRTcHJpdGUodGhpcy5hc3NldCk7XHJcblxyXG4gICAgICAvLyBMb2FkIHRoZSBnYW1lIGxldmVsc1xyXG4gICAgICB2YXIgTGV2ZWxzID0gR2FtZS5MZXZlbHMgPSB0aGlzLmdhbWUuY2FjaGUuZ2V0SlNPTignbGV2ZWxzJyk7XHJcblxyXG4gICAgICAvLyBMb2FkIGxldmVsIGJhY2tncm91bmRzXHJcbiAgICAgIGZvciAodmFyIGkgaW4gTGV2ZWxzKSB7XHJcbiAgICAgICAgdmFyIG9iaiA9IExldmVsc1tpXTtcclxuICAgICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2JhY2tncm91bmQnK2ksIG9iai5iYWNrZ3JvdW5kKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTG9hZCBmb250c1xyXG4gICAgICB0aGlzLmdhbWUubG9hZC5zY3JpcHQoJ3dlYmZvbnQnLCAnLy9hamF4Lmdvb2dsZWFwaXMuY29tL2FqYXgvbGlicy93ZWJmb250LzEuNC43L3dlYmZvbnQuanMnKTtcclxuXHJcbiAgICAgIC8vIExvYWQgbWVudVxyXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2xvZ28nLCAnYXNzZXRzL2xvZ28ucG5nJyk7XHJcblxyXG4gICAgICAvLyBMb2FkIHBsYXllciBzcHJpdGVzXHJcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgnaGVybycsICdhc3NldHMvcGxheWVyX2JsdWUucG5nJyk7XHJcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgnc2hpZWxkJywgJ2Fzc2V0cy9zaGllbGQucG5nJyk7XHJcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgncGxheWVyX2dyZWVuJywgJ2Fzc2V0cy9wbGF5ZXJfZ3JlZW4ucG5nJyk7XHJcblxyXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2xhc2VyX3JlZCcsICdhc3NldHMvbGFzZXJfcmVkLnBuZycpO1xyXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2xhc2VyX3llbGxvdycsICdhc3NldHMvbGFzZXJfeWVsbG93LnBuZycpO1xyXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2xhc2VyX29yYW5nZScsICdhc3NldHMvbGFzZXJfb3JhbmdlLnBuZycpO1xyXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2xhc2VyX2dyYXknLCAnYXNzZXRzL2xhc2VyX2dyYXkucG5nJyk7XHJcblxyXG4gICAgICAvLyBMb2FkIGVuZW1pZXNcclxuICAgICAgdGhpcy5sb2FkLmltYWdlKCdlbmVteV8xJywgJ2Fzc2V0cy9lbmVteV8xLnBuZycpO1xyXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2VuZW15XzInLCAnYXNzZXRzL2VuZW15XzIucG5nJyk7XHJcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgnZW5lbXlfMycsICdhc3NldHMvZW5lbXlfMy5wbmcnKTtcclxuXHJcbiAgICAgIC8vIE5leHQgbGV2ZWwgYW5kIGdhbWVvdmVyIGdyYXBoaWNzXHJcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgnbmV4dF9sZXZlbCcsICdhc3NldHMvbGV2ZWxjb21wbGV0ZS1iZy5wbmcnKTtcclxuICAgICAgdGhpcy5sb2FkLmltYWdlKCdnYW1lb3ZlcicsICdhc3NldHMvZ2FtZW92ZXItYmcucG5nJyk7XHJcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgnbmV3JywgJ2Fzc2V0cy9uZXcucG5nJyk7XHJcblxyXG4gICAgICB0aGlzLmxvYWQuc3ByaXRlc2hlZXQoJ2J0bk1lbnUnLCAnYXNzZXRzL2J0bi1tZW51LnBuZycsIDE5MCwgNDksIDIpO1xyXG4gICAgICB0aGlzLmxvYWQuc3ByaXRlc2hlZXQoJ2J0bicsICdhc3NldHMvYnRuLnBuZycsIDQ5LCA0OSwgNik7XHJcbiAgICAgIHRoaXMubG9hZC5zcHJpdGVzaGVldCgnbnVtJywgJ2Fzc2V0cy9udW0ucG5nJywgMTIsIDExLCA1KTtcclxuICAgICAgdGhpcy5sb2FkLnNwcml0ZXNoZWV0KCdib251cycsICdhc3NldHMvYm9udXMucG5nJywgMTYsIDE2LCAyKTtcclxuXHJcbiAgICAgIC8vIE51bWJlcnNcclxuICAgICAgdGhpcy5sb2FkLmltYWdlKCdudW0nLCAnYXNzZXRzL251bS5wbmcnKTtcclxuICAgICAgdGhpcy5sb2FkLmltYWdlKCdsaXZlcycsICdhc3NldHMvbGl2ZXMucG5nJyk7XHJcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgncGFuZWwnLCAnYXNzZXRzL3BhbmVsLnBuZycpO1xyXG5cclxuICAgICAgdGhpcy5sb2FkLmltYWdlKCdsYXNlcicsICdhc3NldHMvbGFzZXIucG5nJyk7XHJcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgnYnVsbGV0JywgJ2Fzc2V0cy9idWxsZXQucG5nJyk7XHJcblxyXG4gICAgICAvLyBBdWRpb1xyXG4gICAgICB0aGlzLmxvYWQuYXVkaW8oJ2xhc2VyRngnLCAnYXNzZXRzL2xhc2VyXzAxLm1wMycpO1xyXG4gICAgICB0aGlzLmxvYWQuYXVkaW8oJ2RpbmsnLCAnYXNzZXRzL2RpbmsubXAzJyk7XHJcbiAgICAgIHRoaXMubG9hZC5hdWRpbygnbWVudV9tdXNpYycsICdhc3NldHMvbWVudV9tdXNpYy5tcDMnKTtcclxuICAgICAgdGhpcy5sb2FkLmF1ZGlvKCdnYW1lX211c2ljJywgJ2Fzc2V0cy9nYW1lX211c2ljLm1wMycpO1xyXG5cclxuICAgICAgdGhpcy5sb2FkLnNwcml0ZXNoZWV0KCdleHBsb3Npb24nLCAnYXNzZXRzL2V4cGxvZGUucG5nJywgMTI4LCAxMjgsIDE2KTtcclxuXHJcbiAgICAgIC8vIEZvbnRzXHJcbiAgICAgIHRoaXMubG9hZC5iaXRtYXBGb250KCdhcmNoaXRlY3RzRGF1Z2h0ZXInLCBcclxuICAgICAgICAnYXNzZXRzL2ZvbnRzL3IucG5nJywgXHJcbiAgICAgICAgJ2Fzc2V0cy9mb250cy9yLmZudCcpO1xyXG5cclxuICAgICAgLy8gRmluYWxseSwgbG9hZCB0aGUgY2FjaGVkIGxldmVsLCBpZiB0aGVyZSBpcyBvbmVcclxuICAgICAgR2FtZS5jdXJyZW50TGV2ZWwgPSAwO1xyXG4gICAgICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2N1cnJlbnRMZXZlbCcpKSB7XHJcbiAgICAgICAgR2FtZS5jdXJyZW50TGV2ZWwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY3VycmVudExldmVsJyk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgY3JlYXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHRoaXMuYXNzZXQuY3JvcEVuYWJsZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgIHRoaXMuZ2FtZS5zdGFnZS5iYWNrZ3JvdW5kQ29sb3IgPSAweDJCM0U0MjtcclxuICAgICAgdmFyIHR3ZWVuID0gdGhpcy5hZGQudHdlZW4odGhpcy5hc3NldClcclxuICAgICAgLnRvKHtcclxuICAgICAgICBhbHBoYTogMFxyXG4gICAgICB9LCA1MDAsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5vbmUsIHRydWUpO1xyXG4gICAgICB0d2Vlbi5vbkNvbXBsZXRlLmFkZCh0aGlzLnN0YXJ0TWFpbk1lbnUsIHRoaXMpO1xyXG5cclxuICAgICAgLy8gTG9hZCBrZXlib2FyZCBjYXB0dXJlXHJcbiAgICAgIHZhciBnYW1lID0gdGhpcy5nYW1lO1xyXG4gICAgICBHYW1lLmN1cnNvcnMgPSBnYW1lLmlucHV0LmtleWJvYXJkLmNyZWF0ZUN1cnNvcktleXMoKTtcclxuICAgICAgLy8gdmFyIG11c2ljID0gdGhpcy5nYW1lLmFkZC5hdWRpbygnZ2FsYXh5Jyk7XHJcbiAgICAgIC8vIG11c2ljLmxvb3AgPSB0cnVlO1xyXG4gICAgICAvLyBtdXNpYy5wbGF5KCcnKTtcclxuICAgICAgLy8gd2luZG93Lm11c2ljID0gbXVzaWM7XHJcbiAgICB9LFxyXG5cclxuICAgIHN0YXJ0TWFpbk1lbnU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAoISF0aGlzLnJlYWR5KSB7XHJcbiAgICAgICAgaWYgKEdhbWUubWFwSWQpIHtcclxuICAgICAgICAgIHRoaXMuZ2FtZS5zdGF0ZS5zdGFydCgnUGxheScpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLmdhbWUuc3RhdGUuc3RhcnQoJ01haW5NZW51Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHRoaXMuZ2FtZS5zdGF0ZS5zdGFydCgnUGxheScpO1xyXG4gICAgICAgIC8vIHRoaXMuZ2FtZS5zdGF0ZS5zdGFydCgnTmV4dExldmVsJyk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlTXVzaWM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAodGhpcy5tdXNpY0lzUGxheWluZyA9ICF0aGlzLm11c2ljSXNQbGF5aW5nKSB7XHJcbiAgICAgICAgbXVzaWMuc3RvcCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG11c2ljLnBsYXkoJycpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIG9uTG9hZENvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHRoaXMucmVhZHkgPSB0cnVlO1xyXG4gICAgfVxyXG4gIH07XHJcbn0pOyIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwJywgW1xyXG4gICd1aS5yb3V0ZXInLFxyXG4gIHJlcXVpcmUoJy4vbWVudScpLm5hbWUsXHJcbiAgcmVxdWlyZSgnLi9nYW1lJykubmFtZSxcclxuICByZXF1aXJlKCcuL3VzZXInKS5uYW1lLFxyXG4gIHJlcXVpcmUoJy4vbmF2YmFyJykubmFtZSxcclxuICByZXF1aXJlKCcuL292ZXJsYXknKS5uYW1lLFxyXG4gIHJlcXVpcmUoJy4vbmV0d29yaycpLm5hbWUsXHJcbl0pXHJcbi5jb25maWcoZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcbiAgJHVybFJvdXRlclByb3ZpZGVyXHJcbiAgICAub3RoZXJ3aXNlKCcvbWVudScpO1xyXG59KVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLm1lbnUnLCBbXHJcbiAgcmVxdWlyZSgnLi9wbGF5X2J1dHRvbicpLm5hbWVcclxuXSlcclxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xyXG4gICRzdGF0ZVByb3ZpZGVyXHJcbiAgICAuc3RhdGUoJ21lbnUnLCB7XHJcbiAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3NjcmlwdHMvbWVudS90ZW1wbGF0ZS5odG1sJyxcclxuICAgICAgdXJsOiAnL21lbnUnXHJcbiAgICB9KVxyXG4gICAgLnN0YXRlKCdtZW51LmhvbWUnLCB7XHJcbiAgICAgIHVybDogJycsXHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnc2NyaXB0cy9tZW51L21haW4uaHRtbCcsXHJcbiAgICAgIGNvbnRyb2xsZXI6ICdNZW51Q29udHJvbGxlciBhcyBjdHJsJyxcclxuICAgICAgb25FbnRlcjogZnVuY3Rpb24oUm9vbSkge1xyXG4gICAgICAgIFJvb20ucXVlcnlGb3JSb29tcygpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG59KVxyXG5cclxucmVxdWlyZSgnLi9tZW51X2NvbnRyb2xsZXInKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLm1lbnUnKVxyXG4uY29udHJvbGxlcignTWVudUNvbnRyb2xsZXInLCBmdW5jdGlvbihteVNvY2tldCwgJHNjb3BlLCBSb29tKSB7XHJcblxyXG4gICRzY29wZS4kb24oJ21hcDp1cGRhdGUnLCBmdW5jdGlvbihldnQsIG1hcElkKSB7XHJcbiAgICBjdHJsLnJvb21zID0gUm9vbS5nZXRSb29tcygpO1xyXG4gIH0pO1xyXG5cclxuICB2YXIgY3RybCA9IHRoaXM7XHJcblxyXG4gIGN0cmwuY3JlYXRlSWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKS50b1N0cmluZygpO1xyXG4gIH07XHJcblxyXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9XHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAubWVudS5wbGF5QnV0dG9uJywgW10pXHJcbi5kaXJlY3RpdmUoJ3BsYXlCdXR0b24nLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc2NvcGU6IHtcclxuICAgICAgb25DbGljazogJyYnXHJcbiAgICB9LFxyXG4gICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwicGxheUJ1dHRvblwiXFxcclxuICAgICAgICBuZy1jbGljaz1cIm9uQ2xpY2soKVwiPlxcXHJcbiAgICAgIDxpIGNsYXNzPVwiaWNvbiBpb24tcGxheVwiPjwvaT5cXFxyXG4gICAgICA8c3BhbiBjbGFzcz1cInBsYXktdGV4dFwiPnBsYXk8L3NwYW4+XFxcclxuICAgIDwvZGl2PidcclxuICB9XHJcbn0pIiwibW9kdWxlLmV4cG9ydHMgPVxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLm5hdmJhcicsIFtdKVxyXG4uZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICB0ZW1wbGF0ZVVybDogJ3NjcmlwdHMvbmF2YmFyL25hdmJhci5odG1sJyxcclxuICAgIGNvbnRyb2xsZXI6ICdOYXZiYXJDb250cm9sbGVyJ1xyXG4gIH1cclxufSlcclxuXHJcbnJlcXVpcmUoJy4vbmF2YmFyX2NvbnRyb2xsZXInKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLm5hdmJhcicpXHJcbi5jb250cm9sbGVyKCdOYXZiYXJDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCBHYW1lLCBwbGF5ZXJzKSB7XHJcblxyXG4gICRzY29wZS5jb25uZWN0ZWRQbGF5ZXJzID0gW107XHJcbiAgJHNjb3BlLmdhbWUgPSBHYW1lO1xyXG5cclxuICAkc2NvcGUuJG9uKCduZXdQbGF5ZXJzJywgZnVuY3Rpb24oZXZ0LCBwbGF5ZXJzKSB7XHJcbiAgICAkc2NvcGUuY29ubmVjdGVkUGxheWVycyA9IHBsYXllcnM7XHJcbiAgfSk7XHJcblxyXG59KSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubmV0d29yaycpXHJcbi5mYWN0b3J5KCdGZWVkSXRlbScsIGZ1bmN0aW9uKCkge1xyXG4gIHZhciBGZWVkSXRlbSA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZGF0YSkge1xyXG4gICAgdGhpcy5pZCA9IGRhdGEuaWQ7XHJcbiAgICB0aGlzLmV2ZW50TmFtZSA9IGV2ZW50TmFtZTtcclxuXHJcbiAgICB0aGlzLm1zZyA9IGRhdGEubmFtZSB8fCBldmVudE5hbWUgKyAnIGhhcHBlbmVkJztcclxuICB9O1xyXG5cclxuICByZXR1cm4gRmVlZEl0ZW07XHJcbn0pXHJcbi5zZXJ2aWNlKCdmZWVkJywgZnVuY3Rpb24obXlTb2NrZXQsICRyb290U2NvcGUsIEZlZWRJdGVtKSB7XHJcbiAgXHJcbiAgLy8gJHJvb3RTY29wZS4kb24oJycpXHJcbiAgdmFyIHNlcnZpY2UgPSB0aGlzLFxyXG4gICAgICBsaXN0ID0gW107XHJcblxyXG4gIHRoaXMubGlzdCA9IGxpc3Q7XHJcbiAgdGhpcy5tYXhMZW5ndGggPSAxMDtcclxuXHJcbiAgdmFyIGFkZFRvTGlzdCA9IGZ1bmN0aW9uKG5hbWUsIGRhdGEpIHtcclxuICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgaXRlbSA9IG5ldyBGZWVkSXRlbShuYW1lLCBkYXRhKTtcclxuICAgICAgbGlzdC51bnNoaWZ0KGl0ZW0pO1xyXG5cclxuICAgICAgaWYgKGxpc3QubGVuZ3RoID4gc2VydmljZS5tYXhMZW5ndGgpIHtcclxuICAgICAgICBsaXN0LnNwbGljZShzZXJ2aWNlLm1heExlbmd0aCwgbGlzdC5sZW5ndGggLSBzZXJ2aWNlLm1heExlbmd0aCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgJHJvb3RTY29wZS4kb24oJ2dhbWU6cmVtb3ZlUGxheWVyJywgZnVuY3Rpb24oZXZ0LCBwbGF5ZXJEYXRhKSB7XHJcbiAgfSk7XHJcblxyXG4gIG15U29ja2V0LnRoZW4oZnVuY3Rpb24oc29ja2V0KSB7XHJcbiAgICAvLyBOZXcgcGxheWVyIGpvaW5lZFxyXG4gICAgc29ja2V0Lm9uKCduZXdQbGF5ZXInLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgIGFkZFRvTGlzdChcImpvaW5cIiwgZGF0YSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBQbGF5ZXIgd2FzIGhpdFxyXG4gICAgc29ja2V0Lm9uKCdwbGF5ZXJIaXQnLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgIGFkZFRvTGlzdChcInBsYXllckhpdFwiLCBkYXRhKTtcclxuICAgIH0pO1xyXG5cclxuICB9KTtcclxuXHJcbn0pO1xyXG4iLCJyZXF1aXJlKCcuL2lvTG9hZGVyJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAubmV0d29yaycsIFtcclxuICAnYnRmb3JkLnNvY2tldC1pbycsXHJcbiAgJ2FwcC5sb2FkZXInXHJcbl0pXHJcbi5jb25maWcoZnVuY3Rpb24oaW9Mb2FkZXJQcm92aWRlcikge1xyXG4gIGNvbnNvbGUubG9nKCdpb0xvYWRlcicsIGlvTG9hZGVyUHJvdmlkZXIpO1xyXG59KVxyXG5cclxucmVxdWlyZSgnLi93cycpO1xyXG5yZXF1aXJlKCcuL3BsYXllcnMnKTtcclxucmVxdWlyZSgnLi9mZWVkJyk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2FkZXInLCBbXSlcclxuLnByb3ZpZGVyKCdpb0xvYWRlcicsIGZ1bmN0aW9uKCkge1xyXG5cclxuICB0aGlzLnNjcmlwdFVybCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4rJy9zb2NrZXQuaW8vc29ja2V0LmlvLmpzJztcclxuXHJcbiAgdGhpcy4kZ2V0ID0gWyckd2luZG93JywgJyRkb2N1bWVudCcsICckcScsIGZ1bmN0aW9uKCR3aW5kb3csICRkb2N1bWVudCwgJHEpIHtcclxuXHJcbiAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpLFxyXG4gICAgICBzY3JpcHRVcmwgPSB0aGlzLnNjcmlwdFVybDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG5cclxuICAgICAgZG9uZTogZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgdmFyIG9uU2NyaXB0TG9hZCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICByZXR1cm4gZGVmZXIucmVzb2x2ZSgkd2luZG93LmlvKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZigkd2luZG93LmlvKXtcclxuICAgICAgICAgIG9uU2NyaXB0TG9hZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgdmFyIHNjcmlwdFRhZyA9ICRkb2N1bWVudFswXS5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuXHJcbiAgICAgICAgICBzY3JpcHRUYWcudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xyXG4gICAgICAgICAgc2NyaXB0VGFnLmFzeW5jID0gdHJ1ZTtcclxuICAgICAgICAgIHNjcmlwdFRhZy5zcmMgPSBzY3JpcHRVcmw7XHJcbiAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgICAgICAgb25TY3JpcHRMb2FkKCk7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgIGRlZmVyLnJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgc2NyaXB0VGFnLm9ubG9hZCA9IG9uU2NyaXB0TG9hZDtcclxuICAgICAgICAgIHZhciBzID0gJGRvY3VtZW50WzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XHJcbiAgICAgICAgICBzLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9XTtcclxuXHJcbiAgdGhpcy5zZXRTY3JpcHRVcmwgPSBmdW5jdGlvbih1cmwpIHtcclxuICAgIHRoaXMuc2NyaXB0VXJsID0gdXJsO1xyXG4gIH07XHJcblxyXG5cclxufSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAubmV0d29yaycpXHJcbi8vIFRoZSBwbGF5ZXIgbW9kZWxcclxuLy8gV2UnbGwgc3RvcmUgdGhlIHBsYXllciBhbmQgdGhlaXIgbmFtZVxyXG4uZmFjdG9yeSgnUGxheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgdmFyIFBsYXllciA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgIHRoaXMuaWQgPSBkYXRhLmlkO1xyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBQbGF5ZXI7XHJcbn0pXHJcbi8vIFRoZSBgcGxheWVyc2Agc2VydmljZSBob2xkcyBhbGwgb2YgdGhlIGN1cnJlbnQgcGxheWVyc1xyXG4vLyBmb3IgdGhlIGdhbWUuIFdlIHVzZSBpdCB0byBtYW5hZ2UgYW55IHBsYXllci1yZWxhdGVkIGRhdGFcclxuLnNlcnZpY2UoJ3BsYXllcnMnLCBmdW5jdGlvbihteVNvY2tldCwgJHJvb3RTY29wZSwgUGxheWVyLCBSb29tKSB7XHJcbiAgXHJcbiAgdmFyIHNlcnZpY2UgPSB0aGlzLFxyXG4gICAgICBsaXN0T2ZQbGF5ZXJzID0gW107XHJcblxyXG4gIHZhciBwbGF5ZXJCeUlkID0gZnVuY3Rpb24oaWQpIHtcclxuICAgIHZhciBwbGF5ZXI7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RPZlBsYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKGxpc3RPZlBsYXllcnNbaV0uaWQgPT09IGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGxpc3RPZlBsYXllcnNbaV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIFNvY2tldCBsaXN0ZW5lcnNcclxuICBteVNvY2tldC50aGVuKGZ1bmN0aW9uKHNvY2tldCkge1xyXG4gICAgc29ja2V0Lm9uKCdnYW1lT3ZlcicsIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGlzdE9mUGxheWVycyA9IFtdO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHNvY2tldC5vbignbWFwOnVwZGF0ZScsIGZ1bmN0aW9uKG1hcCkge1xyXG4gICAgICBjb25zb2xlLmxvZygncGxheWVycyBtYXA6dXBkYXRlJywgbWFwKTtcclxuICAgIH0pXHJcbiAgfSk7XHJcblxyXG4gIC8vIFNjb3BlIGxpc3RlbmVyc1xyXG4gICRyb290U2NvcGUuJG9uKCdnYW1lOnJlbW92ZVBsYXllcicsIGZ1bmN0aW9uKGV2dCwgcGxheWVyRGF0YSkge1xyXG4gICAgdmFyIHBsYXllciA9IHBsYXllckJ5SWQocGxheWVyRGF0YS5pZCk7XHJcbiAgICB2YXIgaWR4ID0gbGlzdE9mUGxheWVycy5pbmRleE9mKHBsYXllcik7XHJcblxyXG4gICAgY29uc29sZS5sb2coJ2dhbWU6cmVtb3ZlUGxheWVyIHBsYXllcnMgcGxheWVyJywgcGxheWVyRGF0YS5pZCwgXy5tYXAobGlzdE9mUGxheWVycywgJ2lkJykpO1xyXG4gICAgbGlzdE9mUGxheWVycy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnbmV3UGxheWVycycsIGxpc3RPZlBsYXllcnMpO1xyXG4gIH0pO1xyXG4gIC8vIERvIHdlIGhhdmUgYSBuZXcgcGxheWVyP1xyXG4gICRyb290U2NvcGUuJG9uKCdnYW1lOm5ld1BsYXllcicsIGZ1bmN0aW9uKGV2dCwgcGxheWVyRGF0YSkge1xyXG4gICAgdmFyIHBsYXllciA9IG5ldyBQbGF5ZXIocGxheWVyRGF0YSk7XHJcbiAgICBsaXN0T2ZQbGF5ZXJzLnB1c2gocGxheWVyKTtcclxuICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnbmV3UGxheWVycycsIGxpc3RPZlBsYXllcnMpO1xyXG4gIH0pO1xyXG5cclxufSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAubmV0d29yaycpXG4uZmFjdG9yeSgnbXlTb2NrZXQnLCBmdW5jdGlvbihpb0xvYWRlciwgJHEsIHNvY2tldEZhY3RvcnksIFVzZXIpIHtcblxuICB2YXIgbXlTb2NrZXQgPSAkcS5kZWZlcigpO1xuXG4gIGlvTG9hZGVyLmRvbmUoKS50aGVuKGZ1bmN0aW9uKGlvKSB7XG4gICAgdmFyIG15SW9Tb2NrZXQgPSBpby5jb25uZWN0KCk7XG5cbiAgICB2YXIgYVNvY2sgPSBzb2NrZXRGYWN0b3J5KHtcbiAgICAgIGlvU29ja2V0OiBteUlvU29ja2V0XG4gICAgfSk7XG5cbiAgICBteVNvY2tldC5yZXNvbHZlKGFTb2NrKTtcbiAgfSk7XG5cbiAgcmV0dXJuIG15U29ja2V0LnByb21pc2U7XG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID1cclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5vdmVybGF5JywgW10pXHJcbi5kaXJlY3RpdmUoJ292ZXJsYXlCYXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgdGVtcGxhdGVVcmw6ICcvc2NyaXB0cy9vdmVybGF5L292ZXJsYXkuaHRtbCcsXHJcbiAgICBjb250cm9sbGVyOiAnT3ZlcmxheUNvbnRyb2xsZXIgYXMgY3RybCdcclxuICB9XHJcbn0pXHJcblxyXG5yZXF1aXJlKCcuL292ZXJsYXlfY29udHJvbGxlci5qcycpOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAub3ZlcmxheScpXHJcbi5jb250cm9sbGVyKCdPdmVybGF5Q29udHJvbGxlcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgcGxheWVycywgZmVlZCkge1xyXG4gIHZhciBjdHJsID0gdGhpcztcclxuXHJcbiAgY3RybC50dXJuT2ZmTXVzaWMgPSBmdW5jdGlvbigpIHtcclxuICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZ2FtZTp0b2dnbGVNdXNpYycpO1xyXG4gIH07XHJcblxyXG4gIGN0cmwudGl0bGUgPSBcIkZlZWRcIjtcclxuXHJcbiAgY3RybC5mZWVkID0gZmVlZC5saXN0O1xyXG4gIGN0cmwuZmVlZExpbWl0ID0gMTA7XHJcblxyXG4gICRzY29wZS4kb24oJ25ld1BsYXllcnMnLCBmdW5jdGlvbihldnQsIHBsYXllcnMpIHtcclxuICAgICRzY29wZS5wbGF5ZXJzID0gcGxheWVycztcclxuICB9KTtcclxuXHJcbn0pIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC51c2VyJylcclxuLnNlcnZpY2UoJ0dhbWUnLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgdGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcblxyXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9XHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAudXNlcicsIFtdKVxyXG5cclxucmVxdWlyZSgnLi91c2VyX3NlcnZpY2UnKTtcclxucmVxdWlyZSgnLi9yb29tX3NlcnZpY2UnKTtcclxucmVxdWlyZSgnLi9nYW1lX3NlcnZpY2UnKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnVzZXInKVxyXG4uc2VydmljZSgnUm9vbScsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRxLCBteVNvY2tldCkge1xyXG4gIHZhciBzZXJ2aWNlID0gdGhpcztcclxuICB2YXIgY3VycmVudFJvb21zID0gW10sXHJcbiAgICAgIGN1cnJlbnRSb29tQ291bnQgPSAwO1xyXG5cclxuICB0aGlzLnF1ZXJ5Rm9yUm9vbXMgPSBmdW5jdGlvbigpIHtcclxuICAgIG15U29ja2V0LnRoZW4oZnVuY3Rpb24oc29ja2V0KSB7XHJcbiAgICAgIHNvY2tldC5lbWl0KCdnZXRNYXBzJyk7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICBteVNvY2tldC50aGVuKGZ1bmN0aW9uKHNvY2tldCkge1xyXG4gICAgc29ja2V0Lm9uKCdnZXRBbGxNYXBzJywgZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICBjdXJyZW50Um9vbXMgPSBkYXRhO1xyXG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ21hcDp1cGRhdGUnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHNvY2tldC5vbignZ2xvYmFsOm5ld1BsYXllcicsIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgdmFyIG1hcElkID0gZGF0YS5tYXAsXHJcbiAgICAgICAgICBtYXAgICA9IGdldFJvb21CeUlkKG1hcElkKTtcclxuXHJcbiAgICAgIGlmIChtYXApIHtcclxuICAgICAgICBtYXAucGxheWVycy5wdXNoKGRhdGEucGxheWVyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgc29ja2V0Lm9uKCduZXdNYXBDcmVhdGVkJywgZnVuY3Rpb24obmV3TWFwKSB7XHJcbiAgICAgIGN1cnJlbnRSb29tcy5wdXNoKG5ld01hcCk7XHJcbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnbWFwOnVwZGF0ZScsIG5ld01hcCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzb2NrZXQub24oJ2dhbWVPdmVyJywgZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICB2YXIgbWFwSWQgPSBkYXRhLm1hcElkLFxyXG4gICAgICAgICAgbWFwICAgPSBnZXRSb29tQnlJZChtYXBJZCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZygnZ2FtZU92ZXInLCBkYXRhLCBtYXApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc29ja2V0Lm9uKCdnbG9iYWw6cGxheWVyTGVmdE1hcCcsIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgdmFyIG1hcElkID0gZGF0YS5tYXBJZCxcclxuICAgICAgICAgIG1hcCAgID0gZ2V0Um9vbUJ5SWQobWFwSWQpO1xyXG5cclxuICAgICAgaWYgKG1hcCkge1xyXG4gICAgICAgIHZhciBpZHggPSBnZXRQbGF5ZXJJbmRleEJ5SWQoZGF0YS5pZCwgbWFwKTtcclxuICAgICAgICBtYXAucGxheWVycy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgfVxyXG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ21hcDp1cGRhdGUnLCBtYXApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc29ja2V0Lm9uKCdnbG9iYWw6cmVtb3ZlTWFwJywgZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICB2YXIgbWFwSWQgPSBkYXRhLm1hcElkLFxyXG4gICAgICAgICAgbWFwICAgPSBnZXRSb29tQnlJZChtYXBJZCk7XHJcblxyXG4gICAgICBpZiAobWFwKSB7XHJcbiAgICAgICAgc2VydmljZS5xdWVyeUZvclJvb21zKCk7XHJcbiAgICAgIH1cclxuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdtYXA6dXBkYXRlJywgbWFwKTtcclxuICAgIH0pO1xyXG5cclxuICB9KTtcclxuXHJcbiAgdGhpcy5nZXRSb29tcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGN1cnJlbnRSb29tcztcclxuICB9O1xyXG5cclxuICB0aGlzLmdldFJvb20gPSBmdW5jdGlvbihpZCkge1xyXG4gICAgcmV0dXJuIGdldFJvb21CeUlkKGlkKTtcclxuICB9O1xyXG5cclxuICB2YXIgZ2V0Um9vbUJ5SWQgPSBmdW5jdGlvbihpZCkge1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdXJyZW50Um9vbXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKGN1cnJlbnRSb29tc1tpXS5pZCA9PT0gaWQpIHtcclxuICAgICAgICByZXR1cm4gY3VycmVudFJvb21zW2ldO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfTtcclxuXHJcbiAgdmFyIGdldFBsYXllckluZGV4QnlJZCA9IGZ1bmN0aW9uKGlkLCBtYXApIHtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWFwLnBsYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIHBsYXllciA9IG1hcC5wbGF5ZXJzW2ldO1xyXG4gICAgICBpZiAocGxheWVyLmlkID09PSBpZCkge1xyXG4gICAgICAgIHJldHVybiBpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAudXNlcicpXHJcbi5zZXJ2aWNlKCdVc2VyJywgZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBjdXJyZW50VXNlciA9XHJcbiAgICBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY3VycmVudFVzZXInKTtcclxuXHJcbiAgaWYgKGN1cnJlbnRVc2VyKSB7XHJcbiAgICBjdXJyZW50VXNlciA9IEpTT04ucGFyc2UoY3VycmVudFVzZXIpO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0Q3VycmVudFVzZXIgPSBmdW5jdGlvbih1KSB7XHJcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY3VycmVudFVzZXInLCBKU09OLnN0cmluZ2lmeSh1KSk7XHJcbiAgICBjdXJyZW50VXNlciA9IHU7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5nZXRDdXJyZW50VXNlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGN1cnJlbnRVc2VyO1xyXG4gIH07XHJcblxyXG4gIHRoaXMubW9kaWZ5Q3VycmVudFVzZXIgPSBmdW5jdGlvbihvcHRzKSB7XHJcbiAgICB2YXIgdSA9IHRoaXMuZ2V0Q3VycmVudFVzZXIoKTtcclxuXHJcbiAgICBpZiAodSkge1xyXG4gICAgICBmb3IgKHZhciBvcHQgaW4gb3B0cykge1xyXG4gICAgICAgIHVbb3B0XSA9IG9wdHNbb3B0XTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnNldEN1cnJlbnRVc2VyKHUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zZXRDdXJyZW50VXNlcihvcHRzKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY3VycmVudFVzZXI7XHJcbiAgfTtcclxuXHJcbn0pOyJdfQ==
