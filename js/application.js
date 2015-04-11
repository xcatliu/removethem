// 应用总入口
window.requestAnimationFrame(function () {
    new GameManager(7, EventManager, HTMLActuator, LocalStorageManager);
});
