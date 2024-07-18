const getContractsAddress = (networkId) => {
    switch (networkId) {
        case 56:
            return '0xC9Ad2F68059dFeB39DBb00A867ebB1f9b782f353';
        default:
            return '0xC9Ad2F68059dFeB39DBb00A867ebB1f9b782f353';
    }
}

const getBusdAddress = (networkId) => {
    switch (networkId) {
        case 56:
            return '0xe9e7cea3dedca5984780bafc599bd69add087d56';
        default:
            return '0xe9e7cea3dedca5984780bafc599bd69add087d56';
    }
}

export default getContractsAddress
