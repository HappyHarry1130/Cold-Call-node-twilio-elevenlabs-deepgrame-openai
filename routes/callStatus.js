const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// 파일 기반 저장소 설정
const STATUS_DIR = path.join(__dirname, '..', 'call-statuses');
if (!fs.existsSync(STATUS_DIR)) {
    fs.mkdirSync(STATUS_DIR);
}

// 상태 저장 함수
const saveCallStatus = (callSid, status) => {
    const filePath = path.join(STATUS_DIR, `${callSid}.json`);
    fs.writeFileSync(filePath, JSON.stringify(status, null, 2), 'utf8');
};

// 상태 로드 함수
const loadCallStatus = (callSid) => {
    const filePath = path.join(STATUS_DIR, `${callSid}.json`);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
};

// 모든 상태 로드 함수
const loadAllCallStatuses = () => {
    const statuses = {};
    if (fs.existsSync(STATUS_DIR)) {
        fs.readdirSync(STATUS_DIR).forEach(file => {
            if (file.endsWith('.json')) {
                const callSid = file.replace('.json', '');
                statuses[callSid] = loadCallStatus(callSid);
            }
        });
    }
    return statuses;
};

// 전화 상태를 저장할 임시 저장소
const callStatuses = new Map();

// 전화 시작 API
router.post('/start-call', async (req, res) => {
    try {
        const { phone, clientName, template } = req.body;
        
        const call = await client.calls.create({
            url: `https://${process.env.SERVER}/outcoming?phonenumber=${encodeURIComponent(phone)}`,
            to: phone,
            from: process.env.FROM_NUMBER,
            record: true,
            method: 'POST',
            statusCallback: `https://${process.env.SERVER}/call-status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallbackMethod: 'POST'
        });

        // 초기 상태 저장
        callStatuses.set(call.sid, {
            id: Date.now(),
            clientName,
            phone,
            status: 'pending',
            template,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                callSid: call.sid,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Error starting call:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start call'
        });
    }
});

// 전화 상태 업데이트
router.post('/call-status', async (req, res) => {
    try {
        // 요청 정보 로깅
        console.log('Received request headers:', req.headers);
        console.log('Raw request body:', req.body);
        console.log('Received request query:', req.query);
        console.log('Received request params:', req.params);

        // Get callSid from either query parameters or request body
        const callSid = req.query.callSid || req.body.CallSid;
        
        if (!callSid) {
            console.error('No CallSid provided in callback');
            return res.status(400).send('Missing CallSid');
        }

        // Twilio의 요청 본문에서 데이터 추출
        const {
            CallStatus: callStatus,
            CallDuration: callDuration,
            To: to,
            From: from,
            Direction: direction,
            ParentCallSid: parentCallSid
        } = req.body;

        console.log('Processing call status update for SID:', callSid, 'with status:', callStatus);

        // 상태 매핑
        const statusMap = {
            'initiated': 'pending',
            'queued': 'pending',
            'ringing': 'in-progress',
            'in-progress': 'in-progress',
            'completed': 'completed',
            'busy': 'failed',
            'no-answer': 'failed',
            'failed': 'failed',
            'canceled': 'failed'
        };

        const mappedStatus = statusMap[callStatus] || 'failed';

        // 현재 상태 로드
        const currentStatus = loadCallStatus(callSid) || {
            id: Date.now(),
            clientName: 'Unknown',
            phone: to || 'Unknown',
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        // 상태 업데이트
        const updatedStatus = {
            ...currentStatus,
            status: mappedStatus,
            duration: callDuration || 0,
            timestamp: new Date().toISOString(),
            direction: direction || 'outbound',
            parentCallSid: parentCallSid || null,
            lastUpdate: {
                status: callStatus,
                timestamp: new Date().toISOString(),
                errorCode: req.body.ErrorCode,
                errorMessage: req.body.ErrorMessage,
                sipResponseCode: req.body.SipResponseCode
            }
        };

        // 상태 저장
        saveCallStatus(callSid, updatedStatus);

        console.log('Call Status Update:', {
            callSid,
            originalStatus: callStatus,
            mappedStatus: mappedStatus,
            duration: callDuration,
            to,
            from,
            direction,
            errorCode: req.body.ErrorCode,
            errorMessage: req.body.ErrorMessage,
            sipResponseCode: req.body.SipResponseCode
        });

        // Twilio에 200 응답 반환
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing call status update:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 전화 상태 조회
router.get('/call-status/:callSid', (req, res) => {
    try {
        const callSid = req.params.callSid;
        const callStatus = loadCallStatus(callSid);

        if (callStatus) {
            res.json({
                success: true,
                data: callStatus
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Call status not found'
            });
        }
    } catch (error) {
        console.error('Error retrieving call status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
});

// 모든 전화 상태 조회
router.get('/call-statuses', (req, res) => {
    try {
        const allStatuses = loadAllCallStatuses();
        const statusesArray = Object.entries(allStatuses).map(([callSid, status]) => ({
            callSid,
            ...status
        }));

        res.json({
            success: true,
            data: statusesArray
        });
    } catch (error) {
        console.error('Error retrieving all call statuses:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
});

module.exports = router; 