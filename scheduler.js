(() => {
    const settings = {
        server: './',
        path: 'data.json',
        bookButtonText: 'Забронировать'
    }
    let data = {}

    let handlers = Symbol('handlers');
    function makeObservable(target) {
        target[handlers] = [];

        target.observe = function (handler) {
            this[handlers].push(handler);
        };

        // 2. Создадим прокси для реакции на изменения
        return new Proxy(target, {
            set(target, property, value, receiver) {
                let success = Reflect.set(...arguments); // перенаправим операцию к оригинальному объекту
                if (success) { // если не произошло ошибки при записи свойства
                    // вызовем обработчики
                    target[handlers].forEach(handler => handler(property, value));
                }
                return success;
            }
        });
    }

    data = makeObservable(data)

    const TIME_SELECTOR = document.createElement('select')
    TIME_SELECTOR.setAttribute('name', 'timeSelector')

    const DATE_SELECTOR = document.createElement('select')
    DATE_SELECTOR.setAttribute('name', 'dateSelector')
    DATE_SELECTOR.addEventListener('change', () => {
        TIME_SELECTOR.innerHTML = ''
        data.timestamps
            .filter(item => new Date(item.timestamp * 1000).toLocaleDateString() === DATE_SELECTOR.value)
            .map(item => {
                const option = document.createElement('option')
                option.innerText = new Date(item.timestamp * 1000).toLocaleTimeString()
                option.value = item.timestamp
                return option
            })
            .forEach(item => {
                TIME_SELECTOR.appendChild(item)
            })
    })

    const fieldsFactory = (fields) => {
        let result = []
        for(const fieldData of fields){
            const field = document.createElement('input')
            field.type = 'text'
            field.name = fieldData
            result.push(field)
        }
        return result
    }

    const generateScheduleBlock = (id) => {
        const css = document.createElement("link")
        css.href = `${id}.css`
        css.rel = 'stylesheet'

        const container = document.createElement('div')
        container.classList.add('scheduler-container')

        // Тут надо подгрузить данные с сервера
        const dates = document.createElement('div')
        dates.classList.add('dates')
        dates.appendChild(DATE_SELECTOR)

        // Тут надо подгрузить данные с сервера
        const days = document.createElement('div')
        days.classList.add('days')
        dates.appendChild(TIME_SELECTOR)


        const action = document.createElement('a')
        action.classList.add('book-action')
        action.innerText = settings.bookButtonText
        action.addEventListener('click', (e) => {
            e.stopPropagation()
            const requestData = {
                timestamp:TIME_SELECTOR.value,
                name: form.querySelector('input[name=name]').value,
                email: form.querySelector('input[name=email]').value,
                phone: form.querySelector('input[name=phone]').value,
            }
            console.log(requestData)
        })

        const form = document.createElement('form')
        form.action = settings.server + id + '/order/create'
        fieldsFactory(['name', 'email', 'phone']).forEach(item=>{
            form.appendChild(item)
        })




        container.appendChild(form)
        container.appendChild(dates)
        container.appendChild(days)
        container.appendChild(action)


        const block = document.createElement('div')
        block.dataset.scheduleId = id


        block.appendChild(container)
        block.appendChild(css)

        block.classList.add('loading')

        data.observe((key, value) => {
            if (key === 'timestamps') {
                DATE_SELECTOR.innerHTML = ''
                TIME_SELECTOR.innerHTML = ''
                const dates = [...new Set(value.map(item => new Date(item.timestamp * 1000).toLocaleDateString()))]
                dates.map(item => {
                    const option = document.createElement('option')
                    option.innerText = item
                    option.value = item
                    return option
                }).forEach(item => {
                    DATE_SELECTOR.appendChild(item)
                })
                DATE_SELECTOR.dispatchEvent(new window.Event('change', { bubbles: true }))

            }
        })

        fetch(settings.server + settings.path).then(async result => {
            if (result.ok) {
                const json = await result.json()
                // Забираем таймштампы

                data.timestamps = json.response
            }
        }).catch(e => {
            console.log(e.message)
        }).finally(() => {
            block.classList.remove('loading')
        })

        return block
    }

    const items = document.querySelectorAll('a[data-scheduler]')
    items.forEach(item => {
        const scheduleId = item.getAttribute('data-scheduler')

        const formBlock = generateScheduleBlock(scheduleId)

        const parent = item.parentNode
        parent.replaceChild(formBlock, item)
    })
})()